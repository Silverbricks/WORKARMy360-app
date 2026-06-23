'use client';

import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { MeResponse, OrgSummary } from '@workarmy/types';
import { accentFor } from '@workarmy/ui';
import { api, bootstrapSession, clearAuthHint, setAccessToken } from '@/lib/api';
import { Sidebar } from './Sidebar';

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

  if (loading || !me || !me.organisation) {
    return <div className="py-24 text-center text-[#64748B]">Loading…</div>;
  }

  const accentStyle = { ['--accent']: accentFor(me.organisation.accountType) } as CSSProperties;

  return (
    <MeContext.Provider value={me}>
      <div style={accentStyle} className="grid gap-6 py-8 md:grid-cols-[230px_1fr]">
        <Sidebar
          accountType={me.organisation.accountType}
          orgName={me.organisation.name}
          onLogout={logout}
        />
        <div className="min-w-0">{children}</div>
      </div>
    </MeContext.Provider>
  );
}
