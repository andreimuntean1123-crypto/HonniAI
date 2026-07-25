'use client';

import { useEffect, useState } from 'react';
import {
  Camera,
  Download,
  Globe,
  KeyRound,
  MessagesSquare,
  Monitor,
  RefreshCw,
  Moon,
  Sun,
  Trash2,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Locale, ThemeMode } from '@/lib/types';
import { useI18n } from '@/components/providers/I18nProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useData } from '@/components/providers/DataProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { PageHeader } from '@/components/layout/PageHeader';
import { Reveal } from '@/components/ui';
import { ApiKeyModal } from '@/components/settings/ApiKeyModal';
import { maskApiKey, readApiKey } from '@/lib/apiKey';
import { brand } from '@/config/brand';

const LOCALE_LABEL: Record<Locale, string> = {
  ro: 'Română',
  ru: 'Русский',
  en: 'English',
};
const LOCALE_FLAG: Record<Locale, string> = { ro: '🇷🇴', ru: '🇷🇺', en: '🇬🇧' };

export default function SettingsPage() {
  const { t, locale, setLocale, locales } = useI18n();
  const { mode, setMode } = useTheme();
  const { signOut, syncEnabled } = useAuth();
  const {
    data,
    syncState,
    updateProfile,
    clearConversations,
    clearAnalyses,
    clearSearches,
    exportAll,
    eraseEverything,
  } = useData();
  const { toast } = useToast();

  const [apiStatus, setApiStatus] = useState<'loading' | 'connected' | 'demo'>('loading');
  const [keyOpen, setKeyOpen] = useState(false);
  const [ownKey, setOwnKey] = useState<string | null>(null);

  useEffect(() => setOwnKey(readApiKey()), [keyOpen]);

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((j: { aiConfigured: boolean }) => setApiStatus(j.aiConfigured ? 'connected' : 'demo'))
      .catch(() => setApiStatus('demo'));
  }, []);

  const themes: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: t('theme.light'), icon: Sun },
    { value: 'dark', label: t('theme.dark'), icon: Moon },
    { value: 'system', label: t('theme.system'), icon: Monitor },
  ];

  const exportData = () => {
    const blob = new Blob([exportAll()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `honni-ai-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast(t('toast.exported'));
  };

  return (
    <div className="container-page pb-16">
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* appearance */}
        <Reveal>
          <section className="card p-5">
            <p className="label">{t('settings.appearance')}</p>
            <div className="grid grid-cols-3 gap-2">
              {themes.map((item) => (
                <button
                  key={item.value}
                  onClick={() => {
                    setMode(item.value);
                    updateProfile({ theme: item.value });
                    toast(t('toast.themeChanged'));
                  }}
                  className={clsx(
                    'flex flex-col items-center gap-2 rounded-2xl border px-3 py-5 text-xs transition-all',
                    mode === item.value
                      ? 'border-brand-500/60 bg-brand-500/10 text-ink ring-neon'
                      : 'border-hairline bg-surface-2/50 text-ink-soft hover:border-brand-500/40',
                  )}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-muted">{t('settings.reducedMotionHint')}</p>
          </section>
        </Reveal>

        {/* language */}
        <Reveal delay={0.05}>
          <section className="card p-5">
            <p className="label flex items-center gap-1.5">
              <Globe size={12} />
              {t('settings.languageSection')}
            </p>
            <div className="grid gap-2">
              {locales.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLocale(l);
                    updateProfile({ locale: l });
                    toast(t('toast.languageChanged'));
                  }}
                  className={clsx(
                    'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-all',
                    locale === l
                      ? 'border-brand-500/60 bg-brand-500/10 text-ink'
                      : 'border-hairline bg-surface-2/50 text-ink-soft hover:border-brand-500/40',
                  )}
                >
                  <span className="text-lg">{LOCALE_FLAG[l]}</span>
                  {LOCALE_LABEL[l]}
                  {locale === l && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-brand-500" />
                  )}
                </button>
              ))}
            </div>
          </section>
        </Reveal>

        {/* data */}
        <Reveal delay={0.1}>
          <section className="card p-5">
            <p className="label">{t('settings.data')}</p>
            <p className="muted mb-4 text-xs">{t('settings.dataHint')}</p>

            <div className="space-y-2">
              <button onClick={exportData} className="btn-secondary btn-sm w-full justify-start">
                <Download size={14} />
                {t('settings.exportData')}
              </button>
              <button
                onClick={() => {
                  clearConversations();
                  toast(t('toast.historyCleared'));
                }}
                className="btn-secondary btn-sm w-full justify-start"
              >
                <MessagesSquare size={14} />
                {t('settings.clearConversations')} ({data.conversations.length})
              </button>
              <button
                onClick={() => {
                  clearAnalyses();
                  toast(t('toast.historyCleared'));
                }}
                className="btn-secondary btn-sm w-full justify-start"
              >
                <Camera size={14} />
                {t('settings.clearAnalyses')} ({data.analyses.length})
              </button>
              <button
                onClick={() => {
                  clearSearches();
                  toast(t('toast.historyCleared'));
                }}
                className="btn-secondary btn-sm w-full justify-start"
              >
                <Trash2 size={14} />
                {t('settings.clearHistory')} ({data.searches.length})
              </button>
              <button
                onClick={() => {
                  if (!window.confirm(t('settings.deleteAccountConfirm'))) return;
                  eraseEverything();
                  signOut();
                  toast(t('settings.deleted'));
                }}
                className="btn-sm w-full justify-start rounded-full border border-red-500/30 bg-red-500/[0.07] px-3.5 py-1.5 text-red-600 transition-colors hover:bg-red-500/15 dark:text-red-300"
              >
                <Trash2 size={14} />
                {t('settings.deleteAccount')}
              </button>
            </div>
          </section>
        </Reveal>

        {/* about */}
        <Reveal delay={0.15}>
          <section className="card p-5">
            <p className="label">{t('settings.about')}</p>
            <p className="muted">{t('settings.aboutText')}</p>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between border-t border-hairline pt-2">
                <dt className="text-ink-muted">{t('settings.version')}</dt>
                <dd className="text-ink">1.0.0</dd>
              </div>
              <div className="flex items-center justify-between border-t border-hairline pt-2">
                <dt className="flex items-center gap-1.5 text-ink-muted">
                  <Zap size={13} />
                  {t('settings.apiStatus')}
                </dt>
                <dd
                  className={clsx(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs',
                    apiStatus === 'connected' || ownKey
                      ? 'bg-brand-500/[0.12] text-brand-700 dark:text-brand-300'
                      : 'bg-amber-500/[0.12] text-amber-700 dark:text-amber-300',
                  )}
                >
                  <span
                    className={clsx(
                      'h-1.5 w-1.5 rounded-full',
                      apiStatus === 'connected' || ownKey ? 'bg-brand-500' : 'bg-amber-500',
                    )}
                  />
                  {apiStatus === 'loading'
                    ? t('common.loading')
                    : apiStatus === 'connected' || ownKey
                      ? t('settings.apiConnected')
                      : t('settings.apiDemo')}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-hairline pt-2">
                <dt className="flex items-center gap-1.5 text-ink-muted">
                  <KeyRound size={13} />
                  {t('apiKey.title')}
                </dt>
                <dd>
                  <button onClick={() => setKeyOpen(true)} className="btn-secondary btn-sm">
                    {ownKey ? (
                      <span className="font-mono text-[11px]">{maskApiKey(ownKey)}</span>
                    ) : (
                      t('apiKey.addButton')
                    )}
                  </button>
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-hairline pt-2">
                <dt className="flex items-center gap-1.5 text-ink-muted">
                  <RefreshCw size={13} />
                  {t('settings.syncStatus')}
                </dt>
                <dd
                  className={clsx(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs',
                    syncEnabled && syncState !== 'error'
                      ? 'bg-brand-500/[0.12] text-brand-700 dark:text-brand-300'
                      : syncState === 'error'
                        ? 'bg-red-500/10 text-red-600 dark:text-red-300'
                        : 'bg-ink/[0.06] text-ink-soft dark:bg-white/[0.08]',
                  )}
                >
                  <span
                    className={clsx(
                      'h-1.5 w-1.5 rounded-full',
                      syncEnabled && syncState !== 'error'
                        ? 'bg-brand-500'
                        : syncState === 'error'
                          ? 'bg-red-500'
                          : 'bg-ink-muted',
                    )}
                  />
                  {!syncEnabled
                    ? t('settings.syncOff')
                    : syncState === 'syncing'
                      ? t('settings.syncing')
                      : syncState === 'error'
                        ? t('settings.syncError')
                        : t('settings.syncOn')}
                </dd>
              </div>
              <p className="text-[11px] leading-relaxed text-ink-muted">
                {syncEnabled ? t('settings.syncOnHint') : t('settings.syncOffHint')}
              </p>
              <div className="flex items-center justify-between border-t border-hairline pt-2">
                <dt className="text-ink-muted">{brand.name}</dt>
                <dd className="text-ink-muted">{brand.tagline[locale]}</dd>
              </div>
            </dl>
          </section>
        </Reveal>
      </div>

      <ApiKeyModal
        open={keyOpen}
        onClose={() => setKeyOpen(false)}
        onChange={() => setOwnKey(readApiKey())}
      />
    </div>
  );
}
