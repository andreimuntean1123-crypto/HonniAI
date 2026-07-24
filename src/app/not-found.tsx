'use client';

import Link from 'next/link';
import { useI18n } from '@/components/providers/I18nProvider';
import { LogoMark } from '@/components/brand/Logo';

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center text-center">
      <LogoMark size={72} decorative className="text-ink opacity-90 dark:text-white" />
      <p className="mt-6 font-display text-6xl font-semibold tracking-tight text-ink">404</p>
      <h1 className="mt-3 font-display text-xl font-semibold text-ink">{t('errors.notFound')}</h1>
      <p className="muted mt-2 max-w-sm">{t('errors.notFoundText')}</p>
      <Link href="/" className="btn-primary mt-7">
        {t('errors.backHome')}
      </Link>
    </div>
  );
}
