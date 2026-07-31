'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Camera,
  ChevronDown,
  Globe,
  Heart,
  Home,
  LogIn,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Salad,
  Settings,
  ShoppingBasket,
  Soup,
  Sun,
  User as UserIcon,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Locale, ThemeMode } from '@/lib/types';
import { useI18n } from '@/components/providers/I18nProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { Logo } from '@/components/brand/Logo';
import { AuthModal } from '@/components/auth/AuthModal';

export const NAV_ITEMS = [
  { href: '/', key: 'nav.home', icon: Home },
  { href: '/recipes', key: 'nav.recipes', icon: UtensilsCrossed },
  { href: '/analyze', key: 'nav.analyze', icon: Camera },
  { href: '/planner', key: 'nav.planner', icon: Salad },
  { href: '/cuisines', key: 'nav.cuisines', icon: Soup },
  { href: '/shopping-list', key: 'nav.shopping', icon: ShoppingBasket },
  { href: '/favorites', key: 'nav.favorites', icon: Heart },
] as const;

const LOCALE_FLAG: Record<Locale, string> = { ro: '🇷🇴', ru: '🇷🇺', en: '🇬🇧' };

export function Header() {
  const { t, locale, setLocale, locales } = useI18n();
  const { mode, resolved, setMode } = useTheme();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close every popover on navigation.
  useEffect(() => {
    setMobileOpen(false);
    setLangOpen(false);
    setUserOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: t('theme.light'), icon: Sun },
    { value: 'dark', label: t('theme.dark'), icon: Moon },
    { value: 'system', label: t('theme.system'), icon: Monitor },
  ];

  return (
    <>
      <header
        className={clsx(
          'no-print sticky top-0 z-50 transition-all duration-300',
          scrolled ? 'glass-strong shadow-soft' : 'border-b border-transparent bg-transparent',
        )}
      >
        <div className="container-page flex h-[var(--header-h)] items-center gap-3">
          <Link href="/" className="shrink-0" aria-label="Honni AI">
            <Logo size={26} />
          </Link>

          {/* desktop navigation */}
          <nav className="mx-auto hidden items-center gap-0.5 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'relative rounded-full px-3.5 py-2 text-sm transition-colors',
                  isActive(item.href)
                    ? 'text-ink'
                    : 'text-ink-muted hover:text-ink',
                )}
              >
                {isActive(item.href) && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-ink/[0.06] dark:bg-white/[0.08]"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{t(item.key)}</span>
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            {/* language */}
            <div className="relative">
              <button
                onClick={() => {
                  setLangOpen((v) => !v);
                  setUserOpen(false);
                }}
                className="icon-btn w-auto gap-1 px-2.5"
                aria-label={t('language.change')}
              >
                <Globe size={16} />
                {/* Sub 400px antetul nu are loc și pentru codul limbii:
                    rămâne doar globul, meniul se deschide la fel. */}
                <span className="text-xs font-medium uppercase max-[400px]:hidden">{locale}</span>
                <ChevronDown size={12} className="opacity-60 max-[400px]:hidden" />
              </button>
              <Popover open={langOpen} onClose={() => setLangOpen(false)}>
                {locales.map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLocale(l);
                      setLangOpen(false);
                      toast(t('toast.languageChanged'));
                    }}
                    className={clsx(
                      'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-ink/5 dark:hover:bg-white/5',
                      l === locale ? 'text-ink' : 'text-ink-soft',
                    )}
                  >
                    <span>{LOCALE_FLAG[l]}</span>
                    <span className="flex-1 text-left">{t('meta.localeName') && localeName(l)}</span>
                    {l === locale && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
                  </button>
                ))}
              </Popover>
            </div>

            {/* theme */}
            <button
              onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}
              onDoubleClick={() => setMode('system')}
              className="icon-btn"
              aria-label={t('theme.toggle')}
              title={`${t('theme.label')}: ${
                mode === 'system' ? t('theme.system') : resolved === 'dark' ? t('theme.dark') : t('theme.light')
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={resolved}
                  initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.22 }}
                  className="no-theme-transition flex"
                >
                  {resolved === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
                </motion.span>
              </AnimatePresence>
            </button>

            {/* account */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setUserOpen((v) => !v);
                    setLangOpen(false);
                  }}
                  className="ml-0.5 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-hairline bg-surface-2 text-xs font-semibold text-ink transition-transform hover:scale-105"
                  aria-label={t('nav.profile')}
                >
                  {user.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.picture} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user.name.slice(0, 1).toUpperCase()
                  )}
                </button>
                <Popover open={userOpen} onClose={() => setUserOpen(false)} className="w-56">
                  <div className="border-b border-hairline px-3 pb-2.5 pt-1">
                    <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                    <p className="truncate text-xs text-ink-muted">{user.email}</p>
                  </div>
                  <MenuLink href="/profile" icon={UserIcon} label={t('nav.profile')} />
                  <MenuLink href="/settings" icon={Settings} label={t('nav.settings')} />
                  <MenuLink href="/favorites" icon={Heart} label={t('nav.favorites')} />
                  <div className="mt-1 border-t border-hairline pt-1">
                    <div className="flex gap-1 px-1 pb-1">
                      {themeOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setMode(opt.value)}
                          className={clsx(
                            'flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] transition-colors',
                            mode === opt.value
                              ? 'bg-brand-500/[0.12] text-ink'
                              : 'text-ink-muted hover:bg-ink/5 dark:hover:bg-white/5',
                          )}
                        >
                          <opt.icon size={14} />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        signOut();
                        setUserOpen(false);
                        toast(t('auth.signedOut'));
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink dark:hover:bg-white/5"
                    >
                      <LogOut size={15} />
                      {t('auth.signOut')}
                    </button>
                  </div>
                </Popover>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="btn-primary btn-sm ml-1 max-[400px]:aspect-square max-[400px]:px-0"
                aria-label={t('common.signIn')}
              >
                {/* Pe ecrane foarte înguste rămâne doar iconița — textul
                    „Autentificare" scotea antetul în afara ecranului. */}
                <LogIn size={16} className="hidden max-[400px]:block" aria-hidden />
                <span className="max-[400px]:hidden">{t('common.signIn')}</span>
              </button>
            )}

            {/* mobile menu */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="icon-btn lg:hidden"
              aria-label={t('nav.menu')}
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {/* mobile dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong overflow-hidden border-t border-hairline lg:hidden"
            >
              <div className="container-page grid grid-cols-2 gap-1.5 py-4">
                {[...NAV_ITEMS, { href: '/profile', key: 'nav.profile', icon: UserIcon }, { href: '/settings', key: 'nav.settings', icon: Settings }].map(
                  (item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-sm transition-colors',
                        isActive(item.href)
                          ? 'bg-brand-500/[0.12] text-ink'
                          : 'text-ink-soft hover:bg-ink/5 dark:hover:bg-white/5',
                      )}
                    >
                      <item.icon size={17} className="text-ink-muted" />
                      {t(item.key)}
                    </Link>
                  ),
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

function localeName(l: Locale) {
  return l === 'ro' ? 'Română' : l === 'ru' ? 'Русский' : 'English';
}

function Popover({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-0" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className={clsx(
              'glass-strong absolute right-0 top-[calc(100%+0.5rem)] z-10 w-44 rounded-2xl p-1.5 shadow-lifted',
              className,
            )}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof UserIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink dark:hover:bg-white/5"
    >
      <Icon size={15} />
      {label}
    </Link>
  );
}

export default Header;
