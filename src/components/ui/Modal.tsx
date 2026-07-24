'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** `sheet` slides from the bottom on mobile, `center` always centers. */
  variant?: 'center' | 'sheet';
  className?: string;
  footer?: React.ReactNode;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  variant = 'center',
  className,
  footer,
}: ModalProps) {
  // Lock body scroll and close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="no-print fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
          <motion.div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: variant === 'sheet' ? 40 : 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: variant === 'sheet' ? 40 : 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={clsx(
              'glass-strong relative z-10 flex max-h-[92dvh] w-full flex-col shadow-lifted',
              variant === 'sheet'
                ? 'rounded-t-3xl sm:max-w-2xl sm:rounded-3xl'
                : 'mx-4 max-w-2xl rounded-3xl',
              className,
            )}
          >
            {title && (
              <header className="flex items-center justify-between gap-4 border-b border-hairline px-5 py-4">
                <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
                  {title}
                </h2>
                <button onClick={onClose} className="icon-btn" aria-label="Close">
                  <X size={18} />
                </button>
              </header>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && (
              <footer className="border-t border-hairline px-5 py-4 safe-bottom">{footer}</footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default Modal;
