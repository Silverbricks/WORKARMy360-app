'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Job, OrganisationDetail } from '@workarmy/types';
import { Button, Card } from '@workarmy/ui';
import { api } from '@/lib/api';
import { useMe } from './DashboardShell';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-[#64748B]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#1E293B]">{value}</p>
    </Card>
  );
}

export function DashboardHome() {
  const me = useMe();
  const org = me.organisation;
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [detail, setDetail] = useState<OrganisationDetail | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [j, d] = await Promise.all([api.jobs.mine(), api.organisations.getMe()]);
        if (active) {
          setJobs(j);
          setDetail(d);
        }
      } catch {
        // ignore — counts show 0
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const published = jobs?.filter((j) => j.status === 'PUBLISHED').length ?? 0;
  const drafts = jobs?.filter((j) => j.status === 'DRAFT').length ?? 0;
  const completeness = detail?.profile?.completeness ?? 0;

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-4 p-6">
        <span
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg font-semibold text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {org.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl">{org.name}</h1>
          <p className="mt-0.5 text-sm text-[#64748B]">
            WorkArmy ID: <span className="font-mono text-[#1E293B]">{org.waId}</span>
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-medium text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {org.accountType.replace(/_/g, ' ')}
        </span>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Published jobs" value={published} />
        <Stat label="Draft jobs" value={drafts} />
        <Stat label="Total jobs" value={jobs?.length ?? 0} />
        <Stat label="Profile complete" value={`${completeness}%`} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/profile">
          <Button variant="secondary">Edit profile</Button>
        </Link>
        <Link href="/dashboard/jobs">
          <Button>Post a job</Button>
        </Link>
      </div>
    </div>
  );
}
