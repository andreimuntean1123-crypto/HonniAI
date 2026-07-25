'use client';

import { useEffect, useState } from 'react';
import { Loader2, LogIn, Sparkles, UserPlus } from 'lucide-react';
import { clsx } from 'clsx';
import { useI18n } from '@/components/providers/I18nProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { Modal } from '@/components/ui/Modal';
import { LogoMark } from '@/components/brand/Logo';

/**
 * Account sheet: email + password only.
 *
 * Sign-in and registration are the same form in two modes, switched by the
 * segmented control at the top so it is always obvious which one is active.
 * A demo account is offered separately for trying the app without signing up.
 */
export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { signInWithPassword, signUpWithPassword, signInDemo } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The sheet stays mounted between openings, so without this reset a user who
  // once created an account would find it stuck in "create account" mode, with
  // the old email prefilled, and be told the account already exists.
  useEffect(() => {
    if (!open) return;
    setMode('signin');
    setName('');
    setEmail('');
    setPassword('');
    setError(null);
  }, [open]);

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next);
    setError(null);
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError(t('auth.invalidEmail'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.weakPassword'));
      return;
    }

    setBusy(true);
    const res =
      mode === 'signup'
        ? await signUpWithPassword({ email: address, password, name })
        : await signInWithPassword({ email: address, password });
    setBusy(false);

    if (res.ok) {
      toast(t('auth.welcomeBack', { name: name.trim() || address.split('@')[0] }));
      onClose();
      setPassword('');
      return;
    }

    // "taken" only happens on sign-up; offer the obvious next step.
    if (res.error === 'taken') {
      setError(t('auth.emailTaken'));
      setMode('signin');
      return;
    }
    setError(res.error === 'network' ? t('auth.networkError') : t('auth.invalid'));
  };

  const isSignUp = mode === 'signup';

  return (
    <Modal open={open} onClose={onClose} variant="sheet" className="sm:max-w-md">
      <div className="flex flex-col items-center pb-1 text-center">
        <LogoMark size={40} className="text-ink dark:text-white" decorative />
        <h2 className="mt-3 font-display text-xl font-semibold tracking-tight text-ink">
          {isSignUp ? t('auth.signUpTitle') : t('auth.signInTitle')}
        </h2>
        <p className="muted mt-1 text-xs">{t('auth.signInSubtitle')}</p>
      </div>

      {/* mode switch */}
      <div className="mt-5 grid grid-cols-2 gap-1 rounded-full border border-hairline bg-surface-2/70 p-1">
        {(
          [
            { value: 'signin' as const, label: t('auth.signIn'), icon: LogIn },
            { value: 'signup' as const, label: t('auth.signUp'), icon: UserPlus },
          ]
        ).map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => switchMode(tab.value)}
            aria-pressed={mode === tab.value}
            className={clsx(
              'inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all',
              mode === tab.value
                ? 'bg-surface text-ink shadow-soft'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-3">
        {isSignUp && (
          <div>
            <label className="label" htmlFor="auth-name">
              {t('auth.name')} <span className="normal-case">({t('common.optional')})</span>
            </label>
            <input
              id="auth-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder={t('auth.namePlaceholder')}
            />
          </div>
        )}

        <div>
          <label className="label" htmlFor="auth-email">
            {t('auth.email')}
          </label>
          <input
            id="auth-email"
            type="email"
            inputMode="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="nume@exemplu.com"
            autoFocus
          />
        </div>

        <div>
          <label className="label" htmlFor="auth-password">
            {t('auth.password')}
          </label>
          <input
            id="auth-password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            placeholder="••••••"
          />
          {isSignUp && <p className="mt-1.5 text-[11px] text-ink-muted">{t('auth.passwordHint')}</p>}
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300"
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full justify-center py-3">
          {busy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isSignUp ? (
            <UserPlus size={16} />
          ) : (
            <LogIn size={16} />
          )}
          {isSignUp ? t('auth.signUp') : t('auth.signIn')}
        </button>
      </form>

      <div className="mt-4 flex flex-col items-center gap-2 text-xs text-ink-muted">
        <button onClick={() => switchMode(isSignUp ? 'signin' : 'signup')} className="link">
          {isSignUp ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
          <span className="text-brand-600 dark:text-brand-400">
            {isSignUp ? t('auth.signIn') : t('auth.signUp')}
          </span>
        </button>

        <button
          onClick={() => {
            signInDemo();
            toast(t('auth.welcomeBack', { name: 'Demo' }));
            onClose();
          }}
          className="btn-ghost btn-sm"
        >
          <Sparkles size={14} />
          {t('auth.demo')}
        </button>

        <p className="mt-1 text-center text-[11px] leading-relaxed">{t('auth.guestNotice')}</p>
      </div>
    </Modal>
  );
}

export default AuthModal;
