'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { uid } from '@/lib/storage';

type ToastKind = 'success' | 'error' | 'info';
type Toast = { id: string; message: string; kind: ToastKind };

type ToastValue = {
  toast: (message: string, kind?: ToastKind) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastValue | null>(null);

const ICONS: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
};

const ACCENT: Record<ToastKind, string> = {
  success: 'text-brand-500',
  error: 'text-red-500',
  info: 'text-ink-soft',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      const id = uid('toast');
      setToasts((prev) => [...prev.slice(-2), { id, message, kind }]);
      window.setTimeout(() => dismiss(id), 3600);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="no-print pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 px-4 sm:bottom-8"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = ICONS[t.kind];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="glass-strong pointer-events-auto flex max-w-[min(92vw,26rem)] items-center gap-3 rounded-2xl px-4 py-3 shadow-lifted"
              >
                <Icon size={18} className={ACCENT[t.kind]} aria-hidden />
                <span className="flex-1 text-sm text-ink">{t.message}</span>
                <button
                  onClick={() => dismiss(t.id)}
                  className="icon-btn h-7 w-7"
                  aria-label="Close"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
