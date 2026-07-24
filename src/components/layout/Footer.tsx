'use client';

import Link from 'next/link';
import { useI18n } from '@/components/providers/I18nProvider';
import { Logo } from '@/components/brand/Logo';
import { brand } from '@/config/brand';

export function Footer() {
  const { t, locale } = useI18n();

  const product = [
    { href: '/recipes', label: t('nav.recipes') },
    { href: '/analyze', label: t('nav.analyze') },
    { href: '/planner', label: t('nav.planner') },
    { href: '/cuisines', label: t('nav.cuisines') },
  ];

  const account = [
    { href: '/favorites', label: t('nav.favorites') },
    { href: '/shopping-list', label: t('nav.shopping') },
    { href: '/profile', label: t('nav.profile') },
    { href: '/settings', label: t('nav.settings') },
  ];

  return (
    <footer className="no-print mt-20 border-t border-hairline pb-24 pt-14 sm:pb-14">
      <div className="container-page grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo size={28} />
          <p className="muted mt-3 max-w-xs">{brand.tagline[locale]}</p>
          <p className="mt-4 text-xs text-ink-muted">{t('footer.disclaimer')}</p>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {t('footer.product')}
          </p>
          <ul className="space-y-2">
            {product.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link text-sm">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {t('nav.profile')}
          </p>
          <ul className="space-y-2">
            {account.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link text-sm">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="container-page mt-10 flex flex-col gap-2 border-t border-hairline pt-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {brand.name}. {t('footer.rights')}
        </p>
        <p>{t('footer.madeWith')}</p>
      </div>
    </footer>
  );
}

export default Footer;
