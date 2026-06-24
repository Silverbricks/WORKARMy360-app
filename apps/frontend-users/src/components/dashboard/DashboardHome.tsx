'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Icon, formatCurrencyAUD, t, type IconName } from '@workarmy/ui';
import { api } from '@/lib/api';
import { useMe } from './DashboardShell';

const QUICK_ACTIONS: { label: string; href: string; icon: IconName }[] = [
  { label: 'Complete profile', href: '/dashboard/profile', icon: 'user' },
  { label: 'Find jobs', href: '/dashboard/jobs', icon: 'search' },
  { label: 'Upload resume', href: '/dashboard/resume', icon: 'file' },
  { label: 'Job preferences', href: '/dashboard/preferences', icon: 'sliders' },
  { label: 'Upload documents', href: '/dashboard/qualifications', icon: 'award' },
  { label: 'My shifts', href: '/dashboard/work', icon: 'calendar' },
];

interface Stats {
  applications: number;
  interviews: number;
  saved: number;
  earningsMonth: number;
  earningsYtd: number;
  earningsTotal: number;
  verified: number;
  pending: number;
  unread: number;
}

function StatCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-[#1E293B]">{title}</p>
      <div className="mt-3">{children}</div>
    </Card>
  );
}

export function DashboardHome() {
  const me = useMe();
  const person = me?.person ?? null;
  const firstName = person?.firstName ?? '';
  const initials =
    `${person?.firstName?.[0] ?? ''}${person?.lastName?.[0] ?? ''}`.toUpperCase() || 'WA';
  const completion = person?.profileCompleteness ?? (person?.profileComplete ? 100 : 0);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [apps, saved, payslips, verifications, notifications] = await Promise.all([
          api.applications.mine().catch(() => []),
          api.jobs.saved().catch(() => []),
          api.work.myPayslips().catch(() => []),
          api.credentials.verifications().catch(() => []),
          api.support.notifications().catch(() => []),
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
          verified: verifications.filter((v) => v.status === 'APPROVED').length,
          pending: verifications.filter((v) => v.status === 'PENDING').length,
          unread: notifications.filter((n) => !n.read).length,
        });
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
        <div className="flex flex-wrap gap-2">
          {stats && stats.unread > 0 ? (
            <Link
              href="/dashboard/support"
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Icon name="bell" size={13} /> {stats.unread} new
            </Link>
          ) : null}
          <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-medium text-[#64748B]">
            {t('dashboard.widget.membership')}: {t('dashboard.membership.free')}
          </span>
          <span
            className="rounded-full px-3 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {person?.accountType.replace(/_/g, ' ') ?? 'JOB SEEKER'}
          </span>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Profile completion */}
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

        {/* Verification status */}
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

        {/* Employment overview */}
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

        {/* Earnings summary */}
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

        {/* Quick actions */}
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
    </div>
  );
}
