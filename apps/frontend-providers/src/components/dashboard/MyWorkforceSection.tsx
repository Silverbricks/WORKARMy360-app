'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { OrgWorker, Team } from '@workarmy/types';
import { Button, Card, Icon } from '@workarmy/ui';
import { api } from '@/lib/api';

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5">
      <p className="text-2xl font-semibold text-[#1E293B]">{value}</p>
      <p className="mt-1 text-xs text-[#64748B]">{label}</p>
    </Card>
  );
}

export function MyWorkforceSection() {
  const [workers, setWorkers] = useState<OrgWorker[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [w, t] = await Promise.all([
        api.staff.workers.list().catch(() => [] as OrgWorker[]),
        api.staff.teams.list().catch(() => [] as Team[]),
      ]);
      if (!active) return;
      setWorkers(w);
      setTeams(t);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const activeWorkers = workers.filter((w) => w.active);

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl">My Workforce</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Active workers" value={activeWorkers.length} />
        <Stat label="Teams" value={teams.length} />
        <Stat label="On-call" value={workers.filter((w) => w.onCall).length} />
      </div>

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#1E293B]">Workers</p>
          <Link href="/dashboard/staff?tab=directory" className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
            Manage staff
          </Link>
        </div>
        {activeWorkers.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#94A3B8]">
            No active workers yet.{' '}
            <Link href="/dashboard/find-staff" style={{ color: 'var(--accent)' }}>
              Find Job Seekers
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-[#E5E7EB]">
            {activeWorkers.map((w) => (
              <li key={w.id} className="flex items-center gap-3 py-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#F1F5F9]">
                  <Icon name="user" size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1E293B]">{w.name}</p>
                  <p className="truncate text-xs text-[#64748B]">{w.staffType || '—'}</p>
                </div>
                {w.onCall ? (
                  <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-medium text-[#166534]">On-call</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/teams">
          <Button variant="secondary">Teams &amp; supervisors</Button>
        </Link>
        <Link href="/dashboard/rosters">
          <Button variant="secondary">Rosters</Button>
        </Link>
      </div>
    </div>
  );
}
