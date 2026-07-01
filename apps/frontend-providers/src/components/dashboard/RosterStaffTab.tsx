'use client';

import { useEffect, useState } from 'react';
import type { RosterSource, RosterStaffCard } from '@workarmy/types';
import { Alert, Card, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { mondayOfToday } from '@/lib/roster-date';

const sourceTone: Record<RosterSource, string> = {
  COMPANY: 'bg-[#ECFDF5] text-[#047857]',
  CONTRACTOR: 'bg-[#EFF6FF] text-[#1D4ED8]',
  AGENCY: 'bg-[#FFF7ED] text-[#C2410C]',
  SOLE_TRADER: 'bg-[#F5F3FF] text-[#6D28D9]',
  NEARBY: 'bg-[#FDF2F8] text-[#BE185D]',
};

/** Staff view — cards for every active worker with skills, visa, week rollup. */
export function RosterStaffTab() {
  const [staff, setStaff] = useState<RosterStaffCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.planner
      .staff(mondayOfToday())
      .then((s) => active && setStaff(s))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;
  if (error) return <Alert tone="error">{error}</Alert>;
  if (staff.length === 0) return <Card className="p-8 text-center text-sm text-[#94A3B8]">No active workers yet.</Card>;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {staff.map((s) => (
        <Card key={s.personId} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-[#1E293B]">{s.name}</p>
              <p className="text-xs text-[#94A3B8]">{s.role ?? 'Worker'}</p>
            </div>
            <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', sourceTone[s.source])}>{s.source.replace('_', ' ')}</span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#64748B]">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: s.availability.includes('Urgent') ? '#C2410C' : s.availability.includes('On-call') ? 'var(--accent)' : '#65A30D' }} />
            {s.availability}
          </p>
          <div className="mt-3 flex gap-4">
            <Metric label="This week" value={`${s.hours}h`} />
            <Metric label="Shifts" value={String(s.shifts)} />
            <Metric label="Pay" value={`$${s.estPay.toLocaleString()}`} />
          </div>
          {s.skills || s.visa ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(s.skills ?? '')
                .split(',')
                .map((k) => k.trim())
                .filter(Boolean)
                .slice(0, 6)
                .map((k) => (
                  <span key={k} className="rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[11px] font-medium text-[#065F46]">
                    {k}
                  </span>
                ))}
              {s.visa ? <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-medium text-[#1D4ED8]">Visa: {s.visa}</span> : null}
            </div>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-base font-semibold text-[#1E293B]">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">{label}</p>
    </div>
  );
}
