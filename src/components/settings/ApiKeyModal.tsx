'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, KeyRound, ShieldCheck, Trash2 } from 'lucide-react';
import { useI18n } from '@/components/providers/I18nProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { Modal } from '@/components/ui/Modal';
import { clearApiKey, detectProvider, maskApiKey, readApiKey, saveApiKey } from '@/lib/apiKey';

/**
 * Lets the user paste their own provider key, for deployments that have none
 * configured. The key stays in this browser and is sent per request; the
 * server uses it for that call only and never stores it.
 */
export function ApiKeyModal({
  open,
  onClose,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  onChange?: () => void;
}) {
  const { t } = useI18n();
  const { toast } = useToast();

  const [existing, setExisting] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setExisting(readApiKey());
    setValue('');
    setError(null);
  }, [open]);

  const save = () => {
    const trimmed = value.trim();
    if (!detectProvider(trimmed)) {
      setError(t('apiKey.invalid'));
      return;
    }
    saveApiKey(trimmed);
    setExisting(trimmed);
    setValue('');
    setError(null);
    toast(t('apiKey.saved'));
    onChange?.();
    onClose();
  };

  const remove = () => {
    clearApiKey();
    setExisting(null);
    toast(t('apiKey.removed'));
    onChange?.();
  };

  return (
    <Modal open={open} onClose={onClose} title={t('apiKey.title')} variant="sheet" className="sm:max-w-md">
      <p className="muted text-sm">{t('apiKey.description')}</p>

      {existing && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-brand-500/30 bg-brand-500/[0.08] px-4 py-3">
          <CheckCircle2 size={16} className="shrink-0 text-brand-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">{t('apiKey.active')}</p>
            <p className="truncate font-mono text-xs text-ink-muted">{maskApiKey(existing)}</p>
          </div>
          <button onClick={remove} className="icon-btn h-8 w-8" aria-label={t('apiKey.remove')}>
            <Trash2 size={15} />
          </button>
        </div>
      )}

      <div className="mt-4">
        <label className="label" htmlFor="api-key-input">
          {existing ? t('apiKey.replace') : t('apiKey.label')}
        </label>
        <input
          id="api-key-input"
          type="password"
          autoComplete="off"
          spellCheck={false}
          className="input font-mono text-xs"
          placeholder="sk-ant-api03-…"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
        {error && (
          <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-300">
            {error}
          </p>
        )}
      </div>

      <p className="mt-4 flex gap-2 rounded-2xl bg-ink/[0.04] px-4 py-3 text-[11px] leading-relaxed text-ink-soft dark:bg-white/[0.06]">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-brand-500" />
        {t('apiKey.privacy')}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={save} disabled={!value.trim()} className="btn-primary btn-sm">
          <KeyRound size={14} />
          {t('common.save')}
        </button>
        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noreferrer noopener"
          className="btn-ghost btn-sm"
        >
          {t('apiKey.getKey')}
          <ExternalLink size={13} />
        </a>
      </div>
    </Modal>
  );
}

export default ApiKeyModal;
