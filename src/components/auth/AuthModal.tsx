'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Mail, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { useI18n } from '@/components/providers/I18nProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { Modal } from '@/components/ui/Modal';
import { LogoMark } from '@/components/brand/Logo';

/** Google + email/password + demo account, in one sheet. */
export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, locale } = useI18n();
  const {
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    signInDemo,
    googleEnabled,
    mountGoogleButton,
    user,
  } = useAuth();
  const { resolved } = useTheme();
  const { toast } = useToast();
  const googleSlot = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Whether Google's own button could be rendered (script may be blocked). */
  const [googleButton, setGoogleButton] = useState<'pending' | 'ok' | 'failed'>('pending');

  useEffect(() => {
    if (!open || !googleEnabled || !googleSlot.current) return;
    let cancelled = false;
    setGoogleButton('pending');
    void mountGoogleButton(googleSlot.current, { theme: resolved, locale }).then((ok) => {
      if (!cancelled) setGoogleButton(ok ? 'ok' : 'failed');
    });
    return () => {
      cancelled = true;
    };
  }, [open, googleEnabled, mountGoogleButton, resolved, locale]);

  // Google's own button signs the user in through its callback, so the sheet
  // closes by reacting to the user appearing rather than to a click handler.
  useEffect(() => {
    if (open && user?.provider === 'google') {
      toast(t('auth.welcomeBack', { name: user.name }));
      onClose();
    }
  }, [open, user, onClose, t, toast]);

  const finish = (userName: string) => {
    toast(t('auth.welcomeBack', { name: userName }));
    onClose();
    setPassword('');
    setError(null);
  };

  const handleGoogle = async () => {
    setBusy(true);
    setError(null);
    const res = await signInWithGoogle();
    setBusy(false);
    if (res.ok && res.fallback) {
      toast(t('auth.googleNotConfigured'), 'info');
      onClose();
      return;
    }
    if (res.ok) finish('Google');
    else setError(t('errors.generic'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
        ? await signUpWithPassword({ email, password, name })
        : await signInWithPassword({ email, password });
    setBusy(false);

    if (res.ok) {
      finish(name || email.split('@')[0]);
      return;
    }
    setError(res.error === 'taken' ? t('auth.emailTaken') : t('auth.invalid'));
  };

  return (
    <Modal open={open} onClose={onClose} variant="sheet" className="sm:max-w-md">
      <div className="flex flex-col items-center pb-2 text-center">
        <LogoMark size={40} className="text-ink dark:text-white" decorative />
        <h2 className="mt-3 font-display text-xl font-semibold tracking-tight text-ink">
          {t('auth.signInTitle')}
        </h2>
        <p className="muted mt-1 text-xs">{t('auth.signInSubtitle')}</p>
      </div>

      {/* Google renders its own button here — the popup flow it opens works even
          in browsers that suppress One Tap. */}
      <div
        ref={googleSlot}
        className={clsx('mt-5 flex justify-center', (!googleEnabled || googleButton !== 'ok') && 'hidden')}
      />

      {googleEnabled && googleButton === 'pending' && (
        <div className="mt-5 flex justify-center py-3 text-ink-muted">
          <Loader2 size={18} className="animate-spin" />
        </div>
      )}

      {/* Fallback: no client ID, or Google's script could not load. */}
      {(!googleEnabled || googleButton === 'failed') && (
        <>
          <button
            onClick={handleGoogle}
            disabled={busy}
            className="btn-secondary mt-5 w-full justify-center py-3"
          >
            <GoogleIcon />
            {t('auth.google')}
          </button>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-amber-600 dark:text-amber-300">
            {googleEnabled ? t('auth.googleUnavailable') : t('auth.googleNotConfiguredHint')}
          </p>
        </>
      )}

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-hairline" />
        <span className="text-[11px] uppercase tracking-wide text-ink-muted">
          {t('auth.email')}
        </span>
        <span className="h-px flex-1 bg-hairline" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'signup' && (
          <div>
            <label className="label" htmlFor="auth-name">
              {t('auth.name')}
            </label>
            <input
              id="auth-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
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
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
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
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
            minLength={6}
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full justify-center py-3">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
          {mode === 'signup' ? t('auth.signUp') : t('auth.signIn')}
        </button>
      </form>

      <div className="mt-4 flex flex-col items-center gap-2 text-xs text-ink-muted">
        <button
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="link"
        >
          {mode === 'signin' ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
          <span className="text-brand-600 dark:text-brand-400">
            {mode === 'signin' ? t('auth.signUp') : t('auth.signIn')}
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

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
      />
    </svg>
  );
}

export default AuthModal;
