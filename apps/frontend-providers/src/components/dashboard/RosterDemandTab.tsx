'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ResolvedConfig, StaffingRequirementView } from '@workarmy/types';
import { Alert, Button, Card, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { addDaysISO, dShort, mondayOfToday } from '@/lib/roster-date';

/** Demand Board — per-day columns of role demand with fill bars (read view). */
export function RosterDemandTab({ config }: { config: ResolvedConfig | null }) {
  const [weekStart, setWeekStart] = useState(mondayOfToday());
  const [reqs, setReqs] = useState<StaffingRequirementView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.planner.requirements
      .list({ from: weekStart, to: addDaysISO(weekStart, 6) })
      .then((r) => active && setReqs(r))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [weekStart]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i)), [weekStart]);
  const catColor = (key: string) => config?.categories.find((c) => c.key === key)?.color ?? '#64748B';
  const byDate = useMemo(() => {
    const m = new Map<string, StaffingRequirementView[]>();
    for (const r of reqs) {
      const list = m.get(r.date) ?? [];
      list.push(r);
      m.set(r.date, list);
    }
    return m;
  }, [reqs]);

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;
  if (error) return <Alert tone="error">{error}</Alert>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => setWeekStart(addDaysISO(weekStart, -7))}>
          ‹
        </Button>
        <span className="min-w-[150px] text-center text-sm font-medium text-[#1E293B]">
          {dShort(days[0])} – {dShort(days[6])}
        </span>
        <Button size="sm" variant="secondary" onClick={() => setWeekStart(addDaysISO(weekStart, 7))}>
          ›
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setWeekStart(mondayOfToday())}>
          This week
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
        {days.map((d) => {
          const list = byDate.get(d) ?? [];
          const totReq = list.reduce((s, r) => s + r.requiredCount, 0);
          const totAsg = list.reduce((s, r) => s + r.assigned, 0);
          const allFull = totReq > 0 && totAsg >= totReq;
          return (
            <Card key={d} className="p-0">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-3 py-2">
                <span className="text-sm font-semibold text-[#1E293B]">{dShort(d)}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium',
                    list.length === 0 ? 'bg-[#F1F5F9] text-[#94A3B8]' : allFull ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEF3C7] text-[#92400E]',
                  )}
                >
                  {list.length === 0 ? 'No demand' : allFull ? 'Filled' : `${totReq - totAsg} vacant`}
                </span>
              </div>
              <div className="space-y-2.5 p-3">
                {list.length === 0 ? (
                  <p className="py-3 text-center text-xs text-[#CBD5E1]">—</p>
                ) : (
                  list.map((r) => {
                    const pct = Math.min(100, Math.round((r.assigned / r.requiredCount) * 100));
                    const short = r.vacant > 0;
                    return (
                      <div key={r.id}>
                        <div className="flex items-center justify-between text-[12px] font-medium text-[#1E293B]">
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: catColor(r.category) }} />
                            {r.role}
                          </span>
                          <span className="text-[#64748B]">
                            {r.assigned}/{r.requiredCount}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#F1F5F9]">
                          <span className="block h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: short ? '#C2410C' : catColor(r.category) }} />
                        </div>
                        <p className={cn('mt-0.5 text-right text-[10px]', short ? 'font-semibold text-[#C2410C]' : 'text-[#94A3B8]')}>
                          {short ? `${r.vacant} short` : 'fully staffed ✓'}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
