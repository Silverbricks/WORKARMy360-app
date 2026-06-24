'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CredentialView, MyApplication, PersonDetail, WorkerShift } from '@workarmy/types';
import { Button, Card, Icon, formatCurrencyAUD, t, type IconName } from '@workarmy/ui';
import { api } from '@/lib/api';
import { useMe } from './DashboardShell';
import { WorkerIdCard } from './WorkerIdCard';

const QUICK_ACTIONS: { label: string; href: string; icon: IconName }[] = [
  { label: 'Complete profile', href: '/dashboard/profile', icon: 'user' },
  { label: 'Find jobs', href: '/dashboard/jobs?tab=find', icon: 'search' },
  { label: 'Upload resume', href: '/dashboard/resume', icon: 'file' },
  { label: 'Job preferences', href: '/dashboard/preferences', icon: 'sliders' },
  { label: 'Upload documents', href: '/dashboard/qualifications', icon: 'award' },
  { label: 'My shifts', href: '/dashboard/work?tab=shifts', icon: 'calendar' },
];

const stageTone: Record<string, string> = {
  APPLIED: 'bg-[#EFF6FF] text-[#1E40AF]',
  SHORTLISTED: 'bg-[#FEF9C3] text-[#854D0E]',
  INTERVIEW: 'bg-[#F3E8FF] text-[#6B21A8]',
  OFFERED: 'bg-[#DCFCE7] text-[#166534]',
  HIRED: 'bg-[#DCFCE7] text-[#166534]',
  REJECTED: 'bg-[#FEE2E2] text-[#991B1B]',
  WITHDRAWN: 'bg-[#F1F5F9] text-[#64748B]',
};

interface Stats {
  applications: number;
  interviews: number;
  saved: number;
  earningsMonth: number;
  earningsYtd: number;
  earningsTotal: number;
  verified: number;
  pending: number;
}

function StatCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-[#1E293B]">{title}</p>
      <div className="mt-3">{children}</div>
    </Card>
  );
}

function shiftTime(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DashboardHome() {
  const me = useMe();
  const person = me?.person ?? null;
  const firstName = person?.firstName ?? '';
  const name = `${person?.firstName ?? ''} ${person?.lastName ?? ''}`.trim() || 'Job Seeker';
  const initials =
    `${person?.firstName?.[0] ?? ''}${person?.lastName?.[0] ?? ''}`.toUpperCase() || 'WA';
  const completion = person?.profileCompleteness ?? (person?.profileComplete ? 100 : 0);
  const profileComplete = person?.profileComplete ?? false;

  const [stats, setStats] = useState<Stats | null>(null);
  const [shifts, setShifts] = useState<WorkerShift[]>([]);
  const [recentApps, setRecentApps] = useState<MyApplication[]>([]);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [badges, setBadges] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [apps, saved, payslips, creds, myShifts, detail] = await Promise.all([
          api.applications.mine().catch(() => [] as MyApplication[]),
          api.jobs.saved().catch(() => []),
          api.work.myPayslips().catch(() => []),
          api.credentials.list().catch(() => [] as CredentialView[]),
          api.work.myShifts().catch(() => [] as WorkerShift[]),
          api.persons.getMe().catch(() => null as PersonDetail | null),
        ]);
        if (!active) return;
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        let earningsMonth = 0;
        let earningsYtd = 0;
        let earningsTotal = 0;
        for (const p of payslips) {
          earningsTotal += p.netPay;
          const d = new Date(p.createdAt);
          if (d.getFullYear() === year) {
            earningsYtd += p.netPay;
            if (d.getMonth() === month) earningsMonth += p.netPay;
          }
        }
        setStats({
          applications: apps.length,
          interviews: apps.filter((a) => a.stage === 'INTERVIEW').length,
          saved: saved.length,
          earningsMonth,
          earningsYtd,
          earningsTotal,
          verified: creds.filter((c) => c.verificationStatus === 'APPROVED').length,
          pending: creds.filter((c) => c.verificationStatus === 'PENDING').length,
        });
        setRecentApps(apps.slice(0, 4));
        const upcoming = myShifts
          .filter((s) => new Date(s.shift.endAt) >= now && s.shift.status !== 'CANCELLED')
          .sort((a, b) => +new Date(a.shift.startAt) - +new Date(b.shift.startAt))
          .slice(0, 4);
        setShifts(upcoming);
        setPhotoId(detail?.profile?.photoDocumentId ?? null);
        setBadges(creds.filter((c) => c.verificationStatus === 'APPROVED').map((c) => c.type));
      } catch {
        // best-effort widgets
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <Card className="flex flex-wrap items-center gap-4 p-6">
        <span
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg font-semibold text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl">{t('dashboard.greeting', { name: firstName ? `, ${firstName}` : '' })}</h1>
          <p className="mt-0.5 text-sm text-[#64748B]">
            {t('dashboard.waId.label')}:{' '}
            <span className="font-mono text-[#1E293B]">{person?.waId ?? '—'}</span>
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-medium text-white"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {person?.accountType.replace(/_/g, ' ') ?? 'JOB SEEKER'}
        </span>
      </Card>

      {/* Apply-readiness nudge (profile only gates applying now) */}
      {!profileComplete ? (
        <Card className="p-5" style={{ borderColor: 'color-mix(in srgb, var(--accent) 35%, white)' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-[#1E293B]">Verify your profile to apply for jobs</p>
              <p className="mt-0.5 text-sm text-[#64748B]">
                Browse jobs, shifts and tasks freely — you only need a complete profile &amp;
                100-point ID when you&apos;re ready to apply.
              </p>
            </div>
            <Link href="/dashboard/profile">
              <Button>Complete my profile →</Button>
            </Link>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
            <div className="h-full rounded-full" style={{ width: `${completion}%`, backgroundColor: 'var(--accent)' }} />
          </div>
        </Card>
      ) : (
        <Card className="flex items-center gap-2.5 p-4" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
          <span className="text-[#16A34A]"><Icon name="check" size={18} /></span>
          <p className="text-sm font-medium text-[#166534]">Profile verified — you&apos;re ready to apply for jobs.</p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title={t('dashboard.widget.profileCompletion')}>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold" style={{ color: 'var(--accent)' }}>
              {completion}%
            </span>
            <Link href="/dashboard/profile" className="text-sm" style={{ color: 'var(--accent)' }}>
              {t('dashboard.completeProfile.cta')}
            </Link>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
            <div className="h-full rounded-full" style={{ width: `${completion}%`, backgroundColor: 'var(--accent)' }} />
          </div>
        </StatCard>

        <StatCard title={t('dashboard.widget.verification')}>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-semibold text-[#16A34A]">{stats?.verified ?? 0}</div>
              <div className="text-xs text-[#64748B]">verified</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-[#854D0E]">{stats?.pending ?? 0}</div>
              <div className="text-xs text-[#64748B]">pending</div>
            </div>
            <Link href="/dashboard/qualifications" className="text-sm" style={{ color: 'var(--accent)' }}>
              Manage
            </Link>
          </div>
        </StatCard>

        <StatCard title={t('dashboard.widget.employment')}>
          <dl className="grid grid-cols-3 gap-3 text-sm">
            {[
              ['Applications', stats?.applications ?? 0],
              ['Interviews', stats?.interviews ?? 0],
              ['Saved', stats?.saved ?? 0],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-[#64748B]">{label}</dt>
                <dd className="text-lg font-semibold text-[#1E293B]">{value}</dd>
              </div>
            ))}
          </dl>
        </StatCard>

        <StatCard title={t('dashboard.widget.earnings')}>
          <dl className="space-y-1.5 text-sm">
            {[
              ['This month', stats?.earningsMonth ?? 0],
              ['Year to date', stats?.earningsYtd ?? 0],
              ['Total', stats?.earningsTotal ?? 0],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between">
                <dt className="text-[#64748B]">{label}</dt>
                <dd className="font-semibold text-[#1E293B]">{formatCurrencyAUD(value as number)}</dd>
              </div>
            ))}
          </dl>
        </StatCard>

        <Card className="p-5 md:col-span-2 lg:col-span-2">
          <p className="text-sm font-medium text-[#1E293B]">{t('dashboard.widget.quickActions')}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm text-[#1E293B] transition hover:bg-[#F8FAFC]"
              >
                <Icon name={action.icon} size={16} />
                <span className="truncate">{action.label}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Worker ID + upcoming shifts + recent applications */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <WorkerIdCard
            name={name}
            waId={person?.waId ?? '—'}
            initials={initials}
            photoId={photoId}
            badges={badges}
            footer={
              <Link href="/dashboard/worker-id" className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                Open my Worker ID →
              </Link>
            }
          />
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1E293B]">My shifts this week</h2>
            <Link href="/dashboard/work?tab=shifts" className="text-sm" style={{ color: 'var(--accent)' }}>
              View all
            </Link>
          </div>
          {shifts.length === 0 ? (
            <p className="mt-3 text-sm text-[#94A3B8]">No upcoming shifts.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {shifts.map((s) => (
                <li key={s.assignmentId} className="rounded-lg border border-[#E5E7EB] p-3">
                  <p className="text-sm font-medium text-[#1E293B]">{s.shift.title}</p>
                  <p className="text-xs text-[#64748B]">
                    {s.org.name} · {shiftTime(s.shift.startAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Recent applications */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1E293B]">Recent applications</h2>
          <Link href="/dashboard/jobs?tab=applied" className="text-sm" style={{ color: 'var(--accent)' }}>
            View all
          </Link>
        </div>
        {recentApps.length === 0 ? (
          <p className="mt-3 text-sm text-[#94A3B8]">You haven&apos;t applied to any jobs yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#F1F5F9]">
            {recentApps.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#1E293B]">{a.job.title}</p>
                  <p className="truncate text-xs text-[#64748B]">{a.job.org.name}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stageTone[a.stage]}`}>
                  {a.stage}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
