'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Camera, Home, Salad, ShoppingBasket, UtensilsCrossed } from 'lucide-react';
import { clsx } from 'clsx';
import { useI18n } from '@/components/providers/I18nProvider';

/** Bottom bar with the five most-used destinations (phones only). */
const TABS = [
  { href: '/', key: 'nav.home', icon: Home },
  { href: '/recipes', key: 'nav.recipes', icon: UtensilsCrossed },
  { href: '/analyze', key: 'nav.analyze', icon: Camera },
  { href: '/planner', key: 'nav.planner', icon: Salad },
  { href: '/shopping-list', key: 'nav.shopping', icon: ShoppingBasket },
] as const;

export function MobileTabBar() {
  const { t } = useI18n();
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="no-print glass-strong fixed inset-x-0 bottom-0 z-[60] border-t border-hairline sm:hidden">
      <div className="safe-bottom flex items-stretch justify-around px-1 pt-1">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                'relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] transition-colors',
                active ? 'text-ink' : 'text-ink-muted',
              )}
            >
              {active && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-brand-500"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <tab.icon size={19} strokeWidth={active ? 2.3 : 1.8} />
              <span className="truncate">{t(tab.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileTabBar;
