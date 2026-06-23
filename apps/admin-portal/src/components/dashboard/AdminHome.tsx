'use client';

import { useEffect, useState } from 'react';
import type { AdminStats } from '@workarmy/types';
import { Card } from '@workarmy/ui';
import { api } from '@/lib/api';
import { useMe } from './DashboardShell';

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-[#64748B]">{label}</p>
      <p className="mt-1 text-2xl font-semibold" style={accent ? { color: 'var(--accent)' } : { color: '#1E293B' }}>
        {value}
      </p>
    </Card>
  );
}

export function AdminHome() {
  const me = useMe();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await api.admin.stats();
        if (active) setStats(s);
      } catch {
        // ignore
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Platform overview</h1>
        <p className="mt-1 text-sm text-[#64748B]">Signed in as {me.user.email}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Job Seekers + members" value={stats?.persons ?? 0} />
        <Stat label="Organisations" value={stats?.organisations ?? 0} />
        <Stat label="Jobs" value={stats?.jobs ?? 0} />
        <Stat label="Applications" value={stats?.applications ?? 0} />
        <Stat label="Pending verifications" value={stats?.pendingVerifications ?? 0} accent />
      </div>
    </div>
  );
}
