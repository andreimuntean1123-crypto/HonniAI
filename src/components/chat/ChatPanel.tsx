'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUp,
  ChefHat,
  Globe2,
  ImagePlus,
  Loader2,
  MessagesSquare,
  Mic,
  MicOff,
  Plus,
  Salad,
  Square,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { AgentId, ChatMessage, Conversation } from '@/lib/types';
import { useI18n } from '@/components/providers/I18nProvider';
import { useData } from '@/components/providers/DataProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useDictation, useSpeaker } from '@/hooks/useSpeech';
import { uid } from '@/lib/storage';
import { Markdown } from '@/components/ui/Markdown';
import { LogoMark } from '@/components/brand/Logo';

export const AGENT_ICON: Record<AgentId, typeof ChefHat> = {
  chef: ChefHat,
  nutrition: Salad,
  cuisine: Globe2,
};

const SUGGESTION_KEYS: Record<AgentId, string[]> = {
  chef: [
    'chat.chefSuggestion1',
    'chat.chefSuggestion2',
    'chat.chefSuggestion3',
    'chat.chefSuggestion4',
  ],
  nutrition: [
    'chat.nutritionSuggestion1',
    'chat.nutritionSuggestion2',
    'chat.nutritionSuggestion3',
    'chat.nutritionSuggestion4',
  ],
  cuisine: [
    'chat.cuisineSuggestion1',
    'chat.cuisineSuggestion2',
    'chat.cuisineSuggestion3',
    'chat.cuisineSuggestion4',
  ],
};

const MAX_IMAGE_MB = 8;

export type ChatPanelProps = {
  agent: AgentId;
  /** Extra hidden context (e.g. the recipe or photo analysis being discussed). */
  systemNote?: string;
  /** Message pre-filled in the composer when the panel opens. */
  prefill?: string;
  /** Sent automatically once, right after mount. */
  autoSend?: string;
  suggestions?: string[];
  showHistory?: boolean;
  className?: string;
  onClose?: () => void;
  compact?: boolean;
};

export function ChatPanel({
  agent,
  systemNote,
  prefill,
  autoSend,
  suggestions,
  showHistory = true,
  className,
  onClose,
  compact = false,
}: ChatPanelProps) {
  const { t, locale } = useI18n();
  const { data, upsertConversation, deleteConversation, conversationsFor } = useData();
  const { toast } = useToast();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(prefill ?? '');
  const [image, setImage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const autoSentRef = useRef(false);

  const speaker = useSpeaker(locale);
  const dictation = useDictation(locale, (text) =>
    setInput((prev) => (prev ? `${prev} ${text}` : text)),
  );

  const history = conversationsFor(agent);
  const quickSuggestions = suggestions ?? SUGGESTION_KEYS[agent].map((k) => t(k));

  // Keep the transcript pinned to the bottom as it grows.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  const persist = useCallback(
    (next: ChatMessage[], id: string) => {
      const conversation: Conversation = {
        id,
        agent,
        title: next.find((m) => m.role === 'user')?.content.slice(0, 60) || t('chat.newChat'),
        createdAt: next[0]?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
        messages: next,
      };
      upsertConversation(conversation);
    },
    [agent, t, upsertConversation],
  );

  const send = useCallback(
    async (rawText: string, attachedImage?: string | null) => {
      const text = rawText.trim();
      if ((!text && !attachedImage) || pending) return;

      const id = conversationId ?? uid('conv');
      if (!conversationId) setConversationId(id);

      const userMessage: ChatMessage = {
        id: uid('msg'),
        role: 'user',
        content: text,
        createdAt: Date.now(),
        image: attachedImage ?? undefined,
      };
      const next = [...messages, userMessage];
      setMessages(next);
      setInput('');
      setImage(null);
      setPending(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const payload = next.map((m) => ({
          role: m.role,
          content: m.content,
          image: m.image,
        }));
        // The hidden note rides along as context on the first user turn.
        if (systemNote && payload.length) {
          payload[payload.length - 1] = {
            ...payload[payload.length - 1],
            content: `${payload[payload.length - 1].content}\n\n[context: ${systemNote}]`,
          };
        }

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            agent,
            locale,
            messages: payload,
            userContext: data.profile.aiContext,
          }),
          signal: controller.signal,
        });

        if (res.status === 429) {
          throw new Error('rate');
        }
        if (!res.ok) throw new Error('http');

        const json = (await res.json()) as { text?: string; demo?: boolean };
        const reply: ChatMessage = {
          id: uid('msg'),
          role: 'assistant',
          content: json.text ?? t('chat.errorGeneric'),
          createdAt: Date.now(),
          demo: json.demo,
        };
        const withReply = [...next, reply];
        setMessages(withReply);
        persist(withReply, id);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          setMessages(next);
          return;
        }
        const message = (error as Error).message === 'rate' ? t('chat.rateLimited') : t('chat.errorGeneric');
        const failed: ChatMessage = {
          id: uid('msg'),
          role: 'assistant',
          content: message,
          createdAt: Date.now(),
          error: true,
        };
        setMessages([...next, failed]);
        toast(message, 'error');
      } finally {
        setPending(false);
        abortRef.current = null;
      }
    },
    [agent, conversationId, data.profile.aiContext, locale, messages, pending, persist, systemNote, t, toast],
  );

  // One-shot auto send (used by "ask about this recipe/photo").
  useEffect(() => {
    if (autoSend && !autoSentRef.current) {
      autoSentRef.current = true;
      void send(autoSend);
    }
  }, [autoSend, send]);

  const stop = () => {
    abortRef.current?.abort();
    setPending(false);
  };

  const startNew = () => {
    setMessages([]);
    setConversationId(null);
    setInput('');
    setImage(null);
    autoSentRef.current = true; // do not replay the auto message
    speaker.stop();
  };

  const openConversation = (conversation: Conversation) => {
    setConversationId(conversation.id);
    setMessages(conversation.messages);
    setHistoryOpen(false);
    autoSentRef.current = true;
  };

  const pickImage = (file: File | undefined) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast(t('analyze.errorType'), 'error');
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast(t('analyze.errorSize', { size: MAX_IMAGE_MB }), 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  const Icon = AGENT_ICON[agent];
  const agentName = t(`agents.${agent}Name`);

  const isEmpty = messages.length === 0;

  const bubbleTail = useMemo(
    () => (pending ? <TypingBubble label={t('chat.thinking')} /> : null),
    [pending, t],
  );

  return (
    <div className={clsx('flex h-full min-h-0 flex-col', className)}>
      {/* ---------------------------------------------------------------- header */}
      <header className="flex items-center gap-3 border-b border-hairline px-4 py-3">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/[0.12] text-brand-600 dark:text-brand-300">
          <Icon size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold text-ink">{agentName}</p>
          <p className="truncate text-[11px] text-ink-muted">{t(`agents.${agent}Role`)}</p>
        </div>

        {showHistory && (
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className={clsx('icon-btn', historyOpen && 'bg-ink/5 text-ink dark:bg-white/10')}
            aria-label={t('chat.history')}
            title={t('chat.history')}
          >
            <MessagesSquare size={17} />
          </button>
        )}
        <button
          onClick={startNew}
          className="icon-btn"
          aria-label={t('chat.newChat')}
          title={t('chat.newChat')}
        >
          <Plus size={18} />
        </button>
        {onClose && (
          <button onClick={onClose} className="icon-btn" aria-label={t('common.close')}>
            <X size={18} />
          </button>
        )}
      </header>

      {/* --------------------------------------------------------------- history */}
      <AnimatePresence initial={false}>
        {historyOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-hairline bg-surface-2/60"
          >
            <div className="max-h-52 overflow-y-auto p-2">
              {history.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-ink-muted">
                  {t('chat.noHistory')}
                </p>
              ) : (
                history.map((c) => (
                  <div key={c.id} className="group flex items-center gap-2">
                    <button
                      onClick={() => openConversation(c)}
                      className="min-w-0 flex-1 rounded-xl px-3 py-2 text-left text-xs text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink dark:hover:bg-white/5"
                    >
                      <span className="block truncate">{c.title}</span>
                      <span className="text-[10px] text-ink-muted">
                        {new Date(c.updatedAt).toLocaleDateString()}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        deleteConversation(c.id);
                        if (conversationId === c.id) startNew();
                      }}
                      className="icon-btn h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------------- transcript */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {isEmpty && (
          <div className="flex flex-col items-center gap-4 px-2 py-8 text-center">
            <LogoMark size={44} className="text-ink opacity-90 dark:text-white" decorative />
            <div>
              <p className="font-display text-base font-semibold text-ink">{agentName}</p>
              <p className="muted mx-auto mt-1 max-w-xs text-xs">{t(`agents.${agent}Desc`)}</p>
            </div>
            {data.profile.aiContext && (
              <p className="rounded-full bg-brand-500/10 px-3 py-1 text-[11px] text-brand-600 dark:text-brand-300">
                {t('chat.contextUsed')}
              </p>
            )}
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            onSpeak={() => (speaker.speaking ? speaker.stop() : speaker.speak(m.content))}
            speaking={speaker.speaking}
            speakSupported={speaker.supported}
            speakLabel={speaker.speaking ? t('chat.speakStop') : t('chat.speak')}
          />
        ))}

        {bubbleTail}
      </div>

      {/* ---------------------------------------------------------- suggestions */}
      {isEmpty && quickSuggestions.length > 0 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
          {quickSuggestions.map((s) => (
            <button
              key={s}
              onClick={() => void send(s)}
              className="chip shrink-0 whitespace-nowrap"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------ composer */}
      <div className="border-t border-hairline px-3 py-3 safe-bottom">
        {image && (
          <div className="relative mb-2 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-16 w-16 rounded-xl object-cover" />
            <button
              onClick={() => setImage(null)}
              className="absolute -right-1.5 -top-1.5 rounded-full bg-ink p-1 text-surface"
              aria-label={t('chat.removeImage')}
            >
              <X size={11} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-1.5 rounded-3xl border border-hairline bg-surface-2/70 p-1.5 transition-colors focus-within:border-brand-500/50 focus-within:ring-4 focus-within:ring-brand-500/10">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => pickImage(e.target.files?.[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="icon-btn h-9 w-9 shrink-0"
            aria-label={t('chat.attach')}
            title={t('chat.attach')}
          >
            <ImagePlus size={18} />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send(input, image);
              }
            }}
            rows={1}
            placeholder={dictation.listening ? t('chat.listening') : t('chat.placeholder')}
            className="max-h-32 min-h-[2.25rem] flex-1 resize-none bg-transparent px-1 py-2 text-sm text-ink outline-none placeholder:text-ink-muted"
          />

          {dictation.supported && (
            <button
              onClick={dictation.toggle}
              className={clsx(
                'icon-btn h-9 w-9 shrink-0',
                dictation.listening && 'bg-red-500/15 text-red-500',
              )}
              aria-label={dictation.listening ? t('chat.voiceStop') : t('chat.voiceStart')}
              title={dictation.listening ? t('chat.voiceStop') : t('chat.voiceStart')}
            >
              {dictation.listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}

          {speaker.speaking && (
            <button
              onClick={speaker.stop}
              className="icon-btn h-9 w-9 shrink-0 text-brand-500"
              aria-label={t('chat.speakStop')}
              title={t('chat.speakStop')}
            >
              <VolumeX size={18} />
            </button>
          )}

          {pending ? (
            <button
              onClick={stop}
              className="btn-primary h-9 w-9 shrink-0 rounded-full !px-0"
              aria-label={t('chat.stop')}
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              onClick={() => void send(input, image)}
              disabled={!input.trim() && !image}
              className="btn-primary h-9 w-9 shrink-0 rounded-full !px-0"
              aria-label={t('chat.send')}
            >
              <ArrowUp size={17} />
            </button>
          )}
        </div>

        {!compact && (
          <p className="mt-2 px-1 text-center text-[10.5px] leading-relaxed text-ink-muted">
            {t('analyze.disclaimer')}
          </p>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function MessageBubble({
  message,
  onSpeak,
  speaking,
  speakSupported,
  speakLabel,
}: {
  message: ChatMessage;
  onSpeak: () => void;
  speaking: boolean;
  speakSupported: boolean;
  speakLabel: string;
}) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={clsx('flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <span className="mt-1 hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/[0.12] sm:flex">
          <LogoMark size={15} className="text-brand-600 dark:text-brand-300" decorative />
        </span>
      )}

      <div className={clsx('group max-w-[85%] space-y-1.5', isUser && 'items-end')}>
        {message.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.image}
            alt=""
            className="ml-auto max-h-52 rounded-2xl object-cover shadow-soft"
          />
        )}
        {(message.content || !message.image) && (
          <div
            className={clsx(
              'rounded-3xl px-4 py-3 text-sm shadow-soft',
              isUser
                ? 'rounded-br-lg bg-ink text-surface dark:bg-white dark:text-black'
                : message.error
                  ? 'rounded-bl-lg border border-red-500/25 bg-red-500/[0.07] text-red-600 dark:text-red-300'
                  : 'glass rounded-bl-lg text-ink',
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <Markdown content={message.content} />
            )}
          </div>
        )}

        {!isUser && !message.error && speakSupported && (
          <button
            onClick={onSpeak}
            className="ml-1 inline-flex items-center gap-1.5 text-[11px] text-ink-muted opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
          >
            {speaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
            {speakLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function TypingBubble({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/[0.12] sm:flex">
        <Loader2 size={13} className="animate-spin text-brand-500" />
      </span>
      <div className="glass inline-flex items-center gap-2 rounded-3xl rounded-bl-lg px-4 py-3">
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-brand-500"
              style={{ animation: `typing-dot 1.2s ${i * 0.15}s infinite` }}
            />
          ))}
        </span>
        <span className="text-xs text-ink-muted">{label}</span>
      </div>
    </div>
  );
}

export default ChatPanel;
