'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { MeResponse } from '@workarmy/types';
import { api, bootstrapSession, clearAuthHint, setAccessToken } from '@/lib/api';
import { Sidebar } from './Sidebar';

const MeContext = createContext<MeResponse | null>(null);

export function useMe(): MeResponse {
  const me = useContext(MeContext);
  if (!me) throw new Error('useMe used outside DashboardShell');
  return me;
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

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
        if (!data.user.adminRole) {
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

  async function logout() {
    try {
      await api.auth.logout();
    } catch {
      // ignore
    }
    setAccessToken(null);
    clearAuthHint();
    router.replace('/login');
  }

  if (loading || !me) {
    return <div className="py-24 text-center text-[#64748B]">Loading…</div>;
  }

  return (
    <MeContext.Provider value={me}>
      <div className="grid gap-6 py-8 md:grid-cols-[230px_1fr]">
        <Sidebar adminRole={me.user.adminRole ?? 'SUB_ADMIN'} onLogout={logout} />
        <div className="min-w-0">{children}</div>
      </div>
    </MeContext.Provider>
  );
}
