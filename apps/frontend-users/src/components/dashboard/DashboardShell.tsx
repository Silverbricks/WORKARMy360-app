'use client';

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { ConversationView, MeResponse, Notification } from '@workarmy/types';
import { t } from '@workarmy/ui';
import { api, bootstrapSession, clearAuthHint, setAccessToken } from '@/lib/api';
import { Sidebar } from './Sidebar';
import { DashboardTopBar } from './DashboardTopBar';
import { VerifyScreen } from './VerifyScreen';

const MeContext = createContext<MeResponse | null>(null);

/** Person/auth data for the signed-in Job Seeker (null until loaded). */
export function useMe(): MeResponse | null {
  return useContext(MeContext);
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationView[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const ok = await bootstrapSession();
      if (!ok) {
        clearAuthHint();
        router.replace('/login');
        return;
      }
      try {
        const data = await api.auth.me();
        if (active) setMe(data);
      } catch {
        clearAuthHint();
        router.replace('/login');
        return;
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  const verified = me?.user.emailVerified ?? false;

  // Topbar dropdown data — only once the dashboard is unlocked.
  useEffect(() => {
    if (!verified) return;
    let active = true;
    (async () => {
      const [convos, notifs] = await Promise.all([
        api.support.conversations().catch(() => []),
        api.support.notifications().catch(() => []),
      ]);
      if (!active) return;
      setConversations(convos);
      setNotifications(notifs);
    })();
    return () => {
      active = false;
    };
  }, [verified]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.support.markAllRead();
    } catch {
      // optimistic — refresh on next load
    }
  }, []);

  async function logout() {
    try {
      await api.auth.logout();
    } catch {
      // clear locally regardless
    }
    setAccessToken(null);
    clearAuthHint();
    router.replace('/login');
  }

  if (loading) {
    return <div className="py-24 text-center text-[#64748B]">{t('common.loading')}</div>;
  }

  return (
    <MeContext.Provider value={me}>
      <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
        <DashboardTopBar
          me={me}
          conversations={conversations}
          notifications={notifications}
          onMarkAllRead={markAllRead}
          onOpenSidebar={() => setMobileOpen(true)}
          onLogout={logout}
        />

        <Suspense fallback={<div className="flex-1 py-24 text-center text-[#64748B]">{t('common.loading')}</div>}>
        <div className="flex flex-1">
          {/* Desktop sidebar */}
          <div className="hidden w-64 shrink-0 border-r border-[#E5E7EB] bg-white lg:block">
            <div className="sticky top-16 h-[calc(100vh-4rem)]">
              <Sidebar
                onLogout={logout}
                badges={{
                  messages: conversations.reduce((n, c) => n + c.unread, 0),
                  notifications: notifications.filter((n) => !n.read).length,
                }}
              />
            </div>
          </div>

          {/* Mobile sidebar overlay */}
          {mobileOpen ? (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute left-0 top-0 h-full w-72 max-w-[80%] bg-white shadow-xl">
                <Sidebar
                  onLogout={logout}
                  onNavigate={() => setMobileOpen(false)}
                  badges={{
                    messages: conversations.reduce((n, c) => n + c.unread, 0),
                    notifications: notifications.filter((n) => !n.read).length,
                  }}
                />
              </div>
            </div>
          ) : null}

          {/* Main */}
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              {verified ? children : <VerifyScreen email={me?.user.email ?? ''} />}
            </div>
          </main>
        </div>
        </Suspense>
      </div>
    </MeContext.Provider>
  );
}
