'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ResolvedConfig, StaffingRequirementView } from '@workarmy/types';
import { Alert, Button, Card, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { addDaysISO, dShort, mondayOfToday } from '@/lib/roster-date';

function hoursOf(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let h = eh + em / 60 - (sh + sm / 60);
  if (h < 0) h += 24;
  return h;
}

interface ClientRoll {
  client: string;
  required: number;
  assigned: number;
  vacant: number;
  cost: number;
}

/** Clients view — this week's demand grouped by client + estimated labour cost. */
export function RosterClientsTab({ config }: { config: ResolvedConfig | null }) {
  const [weekStart, setWeekStart] = useState(mondayOfToday());
  const [reqs, setReqs] = useState<StaffingRequirementView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clientLabel = config?.terminology.client ?? 'Client';

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

  const clients = useMemo(() => {
    const m = new Map<string, ClientRoll>();
    for (const r of reqs) {
      const key = r.client?.trim() || 'Unassigned';
      const c = m.get(key) ?? { client: key, required: 0, assigned: 0, vacant: 0, cost: 0 };
      c.required += r.requiredCount;
      c.assigned += r.assigned;
      c.vacant += r.vacant;
      c.cost += (r.payRate ?? 0) * hoursOf(r.startTime, r.endTime) * r.assigned;
      m.set(key, c);
    }
    return [...m.values()].sort((a, b) => b.required - a.required);
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
          {dShort(weekStart)} – {dShort(addDaysISO(weekStart, 6))}
        </span>
        <Button size="sm" variant="secondary" onClick={() => setWeekStart(addDaysISO(weekStart, 7))}>
          ›
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setWeekStart(mondayOfToday())}>
          This week
        </Button>
      </div>

      {clients.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#94A3B8]">No demand this week.</Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {clients.map((c) => (
            <Card key={c.client} className="border-t-4 p-4" style={{ borderTopColor: 'var(--accent)' }}>
              <p className="font-medium text-[#1E293B]">{c.client}</p>
              <p className="mb-3 text-xs text-[#94A3B8]">{clientLabel}</p>
              <div className="flex gap-4">
                <Stat label="Need" value={c.required} />
                <Stat label="Assigned" value={c.assigned} tone="ok" />
                <Stat label="Vacant" value={c.vacant} tone={c.vacant > 0 ? 'bad' : undefined} />
              </div>
              <p className="mt-3 border-t border-[#E5E7EB] pt-2 text-lg font-semibold text-[#166534]">
                ${Math.round(c.cost).toLocaleString()}
                <span className="ml-1 text-xs font-normal text-[#94A3B8]">est. labour</span>
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'ok' | 'bad' }) {
  return (
    <div>
      <p className={cn('text-lg font-semibold', tone === 'ok' ? 'text-[#166534]' : tone === 'bad' ? 'text-[#B91C1C]' : 'text-[#1E293B]')}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">{label}</p>
    </div>
  );
}
