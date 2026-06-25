'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { DashboardSummary, Job } from '@workarmy/types';
import { Button, Card, Icon, type IconName } from '@workarmy/ui';
import { api } from '@/lib/api';
import { useMe } from './DashboardShell';

function Stat({ label, value, icon, href }: { label: string; value: number; icon: IconName; href: string }) {
  return (
    <Link href={href}>
      <Card className="flex items-center gap-3 p-5 transition hover:shadow-md">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <Icon name={icon} size={20} />
        </span>
        <div>
          <p className="text-2xl font-semibold leading-none text-[#1E293B]">{value}</p>
          <p className="mt-1 text-xs text-[#64748B]">{label}</p>
        </div>
      </Card>
    </Link>
  );
}

const QUICK: { label: string; href: string; icon: IconName }[] = [
  { label: 'Find workers', href: '/dashboard/find-staff', icon: 'search' },
  { label: 'Post a job', href: '/dashboard/jobs?tab=post', icon: 'plus' },
  { label: 'Build roster', href: '/dashboard/rosters', icon: 'calendar' },
  { label: 'Run pay', href: '/dashboard/pay-runs', icon: 'wallet' },
];

export function DashboardHome() {
  const me = useMe();
  const org = me.organisation;
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const [s, j] = await Promise.all([
        api.dashboard.summary().catch(() => null),
        api.jobs.mine().catch(() => [] as Job[]),
      ]);
      if (!active) return;
      setSummary(s);
      setJobs(j);
    })();
    return () => {
      active = false;
    };
  }, []);

  const status = summary?.verificationStatus ?? org.verificationStatus;
  const completeness = summary?.profileCompleteness ?? 0;
  const openRoles = jobs.filter((j) => j.status === 'PUBLISHED');

  const statusBadge =
    status === 'APPROVED'
      ? { label: 'Verified', cls: 'bg-[#DCFCE7] text-[#166534]' }
      : status === 'REJECTED'
        ? { label: 'Verification rejected', cls: 'bg-[#FEE2E2] text-[#991B1B]' }
        : { label: 'Verification pending', cls: 'bg-[#FEF3C7] text-[#92400E]' };

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
            {org.accountType.replace(/_/g, ' ')} · WorkArmy ID:{' '}
            <span className="font-mono text-[#1E293B]">{org.waId}</span>
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>
      </Card>

      {status !== 'APPROVED' ? (
        <Card className="flex flex-wrap items-center gap-3 border-[#FCD34D] bg-[#FFFBEB] p-5">
          <Icon name="shield" size={22} className="text-[#92400E]" />
          <p className="flex-1 text-sm text-[#92400E]">
            Your business is <b>{status === 'REJECTED' ? 'not yet verified' : 'pending verification'}</b>. You
            can set up your profile and explore, but posting jobs and hiring unlock once you&apos;re verified.
          </p>
          <Link href="/dashboard/compliance">
            <Button variant="secondary">Verification &amp; compliance</Button>
          </Link>
        </Card>
      ) : null}

      {completeness < 100 ? (
        <Card className="flex flex-wrap items-center gap-3 p-5">
          <div className="flex-1">
            <p className="text-sm font-medium text-[#1E293B]">
              Business profile {completeness}% complete
            </p>
            <div className="mt-2 h-2 w-full max-w-md overflow-hidden rounded-full bg-[#F1F5F9]">
              <div
                className="h-full rounded-full"
                style={{ width: `${completeness}%`, backgroundColor: 'var(--accent)' }}
              />
            </div>
          </div>
          <Link href="/dashboard/profile">
            <Button variant="secondary">Complete profile</Button>
          </Link>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Open roles" value={summary?.openRoles ?? 0} icon="briefcase" href="/dashboard/jobs?tab=open" />
        <Stat label="Active workers" value={summary?.activeWorkers ?? 0} icon="users" href="/dashboard/workforce" />
        <Stat label="New applicants" value={summary?.newApplicants ?? 0} icon="user" href="/dashboard/jobs?tab=applicants" />
        <Stat label="Pending timesheets" value={summary?.pendingTimesheets ?? 0} icon="clock" href="/dashboard/operations?tab=timesheets" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1E293B]">Open roles</h2>
            <Link href="/dashboard/jobs?tab=open" className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
              Manage
            </Link>
          </div>
          {openRoles.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#94A3B8]">
              No published roles yet.{' '}
              <Link href="/dashboard/jobs?tab=post" style={{ color: 'var(--accent)' }}>
                Post a job
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-[#E5E7EB]">
              {openRoles.slice(0, 5).map((j) => (
                <li key={j.id} className="flex items-center gap-3 py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F1F5F9]">
                    <Icon name="briefcase" size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#1E293B]">{j.title}</p>
                    <p className="truncate text-xs text-[#64748B]">
                      {[j.suburb, j.state].filter(Boolean).join(', ') || '—'}
                      {j.positions ? ` · ${j.positions} position${j.positions > 1 ? 's' : ''}` : ''}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-semibold text-[#166534]">
                    Open
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 text-lg font-semibold text-[#1E293B]">Quick actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {QUICK.map((q) => (
              <Link
                key={q.label}
                href={q.href}
                className="flex flex-col items-center gap-2 rounded-lg border border-[#E5E7EB] p-4 text-center text-sm font-medium text-[#475569] transition hover:bg-[#F8FAFC]"
              >
                <Icon name={q.icon} size={20} style={{ color: 'var(--accent)' }} />
                {q.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
