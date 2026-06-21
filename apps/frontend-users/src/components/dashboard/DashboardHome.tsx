'use client';

import Link from 'next/link';
import { Card, Icon, formatCurrencyAUD, t, type IconName } from '@workarmy/ui';
import { useMe } from './DashboardShell';

const VERIFICATION_ROWS = ['Identity', 'Right to work', 'Licence', 'Compliance'];

const QUICK_ACTIONS: { label: string; href: string; icon: IconName }[] = [
  { label: 'Complete profile', href: '/dashboard/profile', icon: 'user' },
  { label: 'Find jobs', href: '/dashboard/jobs', icon: 'search' },
  { label: 'Upload resume', href: '/dashboard/resume', icon: 'file' },
  { label: 'Update availability', href: '/dashboard/profile', icon: 'calendar' },
  { label: 'Upload documents', href: '/dashboard/qualifications', icon: 'award' },
  { label: 'View applications', href: '/dashboard/jobs', icon: 'briefcase' },
];

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
  const completion = person?.profileComplete ? 100 : 15;

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
        <div className="flex gap-2">
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
            <div
              className="h-full rounded-full"
              style={{ width: `${completion}%`, backgroundColor: 'var(--accent)' }}
            />
          </div>
        </StatCard>

        {/* Verification status (distinct from completion — Principle 4) */}
        <StatCard title={t('dashboard.widget.verification')}>
          <ul className="space-y-1.5 text-sm">
            {VERIFICATION_ROWS.map((row) => (
              <li key={row} className="flex items-center justify-between">
                <span className="text-[#1E293B]">{row}</span>
                <span className="text-[#94A3B8]">{t('dashboard.verification.notStarted')}</span>
              </li>
            ))}
          </ul>
        </StatCard>

        {/* Employment overview */}
        <StatCard title={t('dashboard.widget.employment')}>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['New matches', '0'],
              ['Applications', '0'],
              ['Interviews', '0'],
              ['Status', 'Looking'],
            ].map(([label, value]) => (
              <div key={label}>
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
              ['This week', 0],
              ['This month', 0],
              ['Year to date', 0],
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
