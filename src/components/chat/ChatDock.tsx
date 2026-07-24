'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import type { AgentId } from '@/lib/types';
import { useI18n } from '@/components/providers/I18nProvider';
import { ChatPanel } from './ChatPanel';
import { LogoMark } from '@/components/brand/Logo';

/**
 * The floating assistant available on every page.
 *
 * Any component can open it with a specific agent and a pre-filled or
 * auto-sent message: `useChatDock().open({ agent: 'chef', autoSend: '…' })`.
 */

type OpenOptions = {
  agent?: AgentId;
  prefill?: string;
  autoSend?: string;
  systemNote?: string;
};

type DockValue = {
  open: (options?: OpenOptions) => void;
  close: () => void;
  isOpen: boolean;
};

const DockContext = createContext<DockValue | null>(null);

export function ChatDockProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [options, setOptions] = useState<OpenOptions>({ agent: 'chef' });
  /** Remount key: a new request resets the panel (fresh auto-send). */
  const [session, setSession] = useState(0);

  const open = useCallback((next?: OpenOptions) => {
    setOptions({ agent: 'chef', ...next });
    setSession((s) => s + 1);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <DockContext.Provider value={value}>
      {children}

      {/* floating trigger */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => open()}
            className="no-print fixed bottom-[5.5rem] right-4 z-[70] flex h-14 w-14 items-center justify-center rounded-full text-black shadow-neon sm:bottom-6 sm:right-6"
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgb(var(--brand-400)), rgb(var(--brand-500)) 55%, rgb(var(--brand-600)))',
            }}
            aria-label={t('agents.openChat')}
          >
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-500/40" />
            <LogoMark size={26} className="relative text-black" decorative />
          </motion.button>
        )}
      </AnimatePresence>

      {/* panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="no-print fixed inset-0 z-[75] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className={clsx(
                'absolute inset-0 bg-black/40 backdrop-blur-sm',
                !expanded && 'lg:bg-black/25',
              )}
            />
            <motion.aside
              initial={{ x: '100%', opacity: 0.6 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.4 }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className={clsx(
                'glass-strong relative z-10 flex h-full w-full flex-col shadow-lifted',
                expanded
                  ? 'sm:w-full'
                  : 'sm:max-w-[26rem] sm:rounded-l-3xl lg:max-w-[28rem]',
              )}
            >
              <div className="absolute right-14 top-3.5 z-20 hidden sm:block">
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="icon-btn"
                  aria-label={expanded ? t('chat.collapse') : t('chat.expand')}
                  title={expanded ? t('chat.collapse') : t('chat.expand')}
                >
                  {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>

              <ChatPanel
                key={session}
                agent={options.agent ?? 'chef'}
                prefill={options.prefill}
                autoSend={options.autoSend}
                systemNote={options.systemNote}
                onClose={close}
                className={expanded ? 'mx-auto w-full max-w-3xl' : undefined}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </DockContext.Provider>
  );
}

export function useChatDock(): DockValue {
  const ctx = useContext(DockContext);
  if (!ctx) throw new Error('useChatDock must be used inside <ChatDockProvider>');
  return ctx;
}

/** Small inline button used on cards to jump into the assistant with context. */
export function AskAgentButton({
  agent,
  autoSend,
  systemNote,
  label,
  className,
}: {
  agent: AgentId;
  autoSend?: string;
  systemNote?: string;
  label: string;
  className?: string;
}) {
  const { open } = useChatDock();
  return (
    <button
      onClick={() => open({ agent, autoSend, systemNote })}
      className={clsx('btn-secondary btn-sm', className)}
    >
      <Sparkles size={14} />
      {label}
    </button>
  );
}
