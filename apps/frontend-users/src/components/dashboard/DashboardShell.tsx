'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { MeResponse } from '@workarmy/types';
import { t } from '@workarmy/ui';
import { api, bootstrapSession, clearAuthHint, setAccessToken } from '@/lib/api';
import { Sidebar } from './Sidebar';

const MeContext = createContext<MeResponse | null>(null);

/** Person/auth data for the signed-in Job Seeker (null until loaded). */
export function useMe(): MeResponse | null {
  return useContext(MeContext);
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
      <div className="grid gap-6 py-8 md:grid-cols-[230px_1fr]">
        <Sidebar onLogout={logout} />
        <div className="min-w-0">{children}</div>
      </div>
    </MeContext.Provider>
  );
}
