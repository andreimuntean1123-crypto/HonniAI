'use client';

import { I18nProvider } from '@/components/providers/I18nProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { DataProvider } from '@/components/providers/DataProvider';
import { ChatDockProvider } from '@/components/chat/ChatDock';
import { Onboarding } from '@/components/auth/Onboarding';
import { ScrollRows } from '@/components/ui/ScrollRows';

/**
 * Provider stack.
 * Order matters: DataProvider reads the signed-in user and the active locale.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <AuthProvider>
            <DataProvider>
              <ChatDockProvider>
                {children}
                <Onboarding />
                {/* Face rândurile orizontale folosibile cu rotița și cu săgețile. */}
                <ScrollRows />
              </ChatDockProvider>
            </DataProvider>
          </AuthProvider>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
