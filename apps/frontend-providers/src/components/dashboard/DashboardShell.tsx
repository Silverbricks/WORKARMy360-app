'use client';

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { ConversationView, MeResponse, Notification, OrgSummary } from '@workarmy/types';
import { accentFor } from '@workarmy/ui';
import { api, bootstrapSession, clearAuthHint, setAccessToken } from '@/lib/api';
import { Sidebar } from './Sidebar';
import { DashboardTopBar } from './DashboardTopBar';

const MeContext = createContext<MeResponse | null>(null);

/** Org dashboard context — guaranteed to have an organisation (shell guards it). */
export function useMe(): MeResponse & { organisation: OrgSummary } {
  const me = useContext(MeContext);
  if (!me || !me.organisation) throw new Error('useMe used outside an org DashboardShell');
  return me as MeResponse & { organisation: OrgSummary };
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
        if (!data.organisation) {
          // not a provider account — send to login
          clearAuthHint();
          router.replace('/login');
          return;
        }
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

  // Topbar dropdown data (badges) — once the org is loaded.
  useEffect(() => {
    if (!me?.organisation) return;
    let active = true;
    (async () => {
      const [convos, notifs] = await Promise.all([
        api.support.orgConversations().catch(() => []),
        api.support.notifications().catch(() => []),
      ]);
      if (!active) return;
      setConversations(convos);
      setNotifications(notifs);
    })();
    return () => {
      active = false;
    };
  }, [me?.organisation]);

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

  if (loading || !me || !me.organisation) {
    return <div className="py-24 text-center text-[#64748B]">Loading…</div>;
  }

  const badges = {
    messages: conversations.reduce((n, c) => n + c.unread, 0),
    notifications: notifications.filter((n) => !n.read).length,
  };
  const accentStyle = { ['--accent']: accentFor(me.organisation.accountType) } as CSSProperties;

  return (
    <MeContext.Provider value={me}>
      <div style={accentStyle} className="flex min-h-screen flex-col bg-[#F8FAFC]">
        <DashboardTopBar
          me={me}
          conversations={conversations}
          notifications={notifications}
          onMarkAllRead={markAllRead}
          onOpenSidebar={() => setMobileOpen(true)}
          onLogout={logout}
        />

        <Suspense fallback={<div className="flex-1 py-24 text-center text-[#64748B]">Loading…</div>}>
          <div className="flex flex-1">
            {/* Desktop sidebar */}
            <div className="hidden w-64 shrink-0 border-r border-[#E5E7EB] bg-white lg:block">
              <div className="sticky top-16 h-[calc(100vh-4rem)]">
                <Sidebar onLogout={logout} badges={badges} />
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
                    badges={badges}
                  />
                </div>
              </div>
            ) : null}

            {/* Main */}
            <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-5xl">{children}</div>
            </main>
          </div>
        </Suspense>
      </div>
    </MeContext.Provider>
  );
}
