'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '@/components/providers/I18nProvider';
import { LogoMark } from '@/components/brand/Logo';
import { brand } from '@/config/brand';
import { readStore, writeStore } from '@/lib/storage';

/**
 * Short branded loading screen with the animated logo.
 * Shown once per browser session so navigation never feels blocked.
 */
export function Splash() {
  const { locale } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = readStore<number>('splashSeen', 0);
    const fresh = Date.now() - seen > 1000 * 60 * 30; // 30 minutes
    if (!fresh) return;
    setVisible(true);
    writeStore('splashSeen', Date.now());
    const timer = window.setTimeout(() => setVisible(false), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                'radial-gradient(60% 50% at 50% 45%, rgb(var(--brand-500) / 0.18), transparent 70%)',
            }}
          />
          <LogoMark size={96} animated className="relative text-ink dark:text-white" decorative />
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="relative mt-6 font-display text-xl font-semibold tracking-tight text-ink"
          >
            {brand.shortName}
            <span className="ml-1 bg-gradient-to-r from-brand-500 to-brand-300 bg-clip-text text-transparent">
              AI
            </span>
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            className="relative mt-1.5 text-xs text-ink-muted"
          >
            {brand.tagline[locale]}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Splash;
