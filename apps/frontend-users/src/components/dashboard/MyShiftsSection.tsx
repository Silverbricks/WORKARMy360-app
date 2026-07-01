'use client';

import { useEffect, useState } from 'react';
import type { MarketplaceShift, MyShiftView } from '@workarmy/types';
import { Alert, Button, Card, cn, Icon } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { useTabParam } from '@/lib/use-tab-param';

type Tab = 'mine' | 'open';
const TABS: { key: Tab; label: string }[] = [
  { key: 'mine', label: 'My Shifts' },
  { key: 'open', label: 'Open Shifts' },
];

const statusTone: Record<string, string> = {
  ASSIGNED: 'bg-[#F1F5F9] text-[#64748B]',
  ACCEPTED: 'bg-[#DCFCE7] text-[#166534]',
  CONFIRMED: 'bg-[#DCFCE7] text-[#166534]',
  COMPLETED: 'bg-[#DCFCE7] text-[#166534]',
  DECLINED: 'bg-[#FEF3C7] text-[#92400E]',
  NO_SHOW: 'bg-[#FEE2E2] text-[#991B1B]',
};
const statusLabel: Record<string, string> = {
  ASSIGNED: 'Awaiting your response',
  ACCEPTED: 'Going',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  DECLINED: 'Declined',
  NO_SHOW: 'No show',
};

function dayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function MyShiftsSection() {
  const [tab, setTab] = useTabParam<Tab>(['mine', 'open'], 'mine');
  const [mine, setMine] = useState<MyShiftView[]>([]);
  const [open, setOpen] = useState<MarketplaceShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function loadAll() {
    const [m, o] = await Promise.all([api.planner.worker.myShifts(), api.planner.worker.marketplace()]);
    setMine(m);
    setOpen(o);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await loadAll();
      } catch (e) {
        if (active) setError(errorMessage(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function act(key: string, fn: () => Promise<unknown>, ok?: string) {
    setBusy(key);
    setError(null);
    setInfo(null);
    try {
      await fn();
      await loadAll();
      if (ok) setInfo(ok);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl">My Shifts</h1>
        <p className="text-xs text-[#64748B]">Shifts you&apos;re rostered on, and open shifts you can pick up.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn('rounded-lg px-3 py-1.5 text-sm font-medium', tab === t.key ? 'text-white' : 'bg-[#F1F5F9] text-[#64748B]')}
            style={tab === t.key ? { backgroundColor: 'var(--accent)' } : undefined}
          >
            {t.label}
            {t.key === 'open' && open.length > 0 ? <span className="ml-1.5 rounded-full bg-white/25 px-1.5 text-[11px]">{open.length}</span> : null}
          </button>
        ))}
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {info ? <Alert tone="success">{info}</Alert> : null}

      {tab === 'mine' ? (
        mine.length === 0 ? (
          <Card className="p-8 text-center text-sm text-[#94A3B8]">No shifts yet. When an employer rosters you, it&apos;ll appear here.</Card>
        ) : (
          <div className="space-y-3">
            {mine.map((s) => {
              const pending = s.status === 'ASSIGNED';
              const going = s.status === 'ACCEPTED' || s.status === 'CONFIRMED' || s.status === 'COMPLETED';
              return (
                <Card key={s.assignmentId} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#1E293B]">{s.role}</p>
                      <p className="mt-0.5 text-sm text-[#64748B]">
                        {s.orgName} · {dayLabel(s.date)} · {s.startTime}–{s.endTime}
                        {s.locationText ? ` · ${s.locationText}` : ''}
                      </p>
                    </div>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusTone[s.status] ?? statusTone.ASSIGNED)}>
                      {statusLabel[s.status] ?? s.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pending ? (
                      <>
                        <Button size="sm" loading={busy === `a${s.assignmentId}`} onClick={() => act(`a${s.assignmentId}`, () => api.planner.worker.respond(s.assignmentId, { response: 'ACCEPTED' }), 'Shift accepted — see you there!')}>
                          ✓ Accept
                        </Button>
                        <Button size="sm" variant="secondary" loading={busy === `d${s.assignmentId}`} onClick={() => act(`d${s.assignmentId}`, () => api.planner.worker.respond(s.assignmentId, { response: 'DECLINED' }))}>
                          Decline
                        </Button>
                      </>
                    ) : going ? (
                      <Button size="sm" variant="ghost" loading={busy === `d${s.assignmentId}`} onClick={() => act(`d${s.assignmentId}`, () => api.planner.worker.respond(s.assignmentId, { response: 'DECLINED' }))}>
                        Can&apos;t make it
                      </Button>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : null}

      {tab === 'open' ? (
        open.length === 0 ? (
          <Card className="p-8 text-center text-sm text-[#94A3B8]">No open shifts right now. Employers you work with will list extra shifts here.</Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {open.map((o) => (
              <Card key={o.requirementId} className="flex flex-col gap-3 p-5">
                <div className="flex items-start gap-2">
                  <Icon name="calendar" size={18} style={{ color: 'var(--accent)' }} />
                  <div>
                    <p className="font-medium text-[#1E293B]">{o.role}</p>
                    <p className="text-sm text-[#64748B]">
                      {o.orgName} · {dayLabel(o.date)} · {o.startTime}–{o.endTime}
                      {o.locationText ? ` · ${o.locationText}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#FEE2E2] px-2 py-0.5 text-xs font-medium text-[#991B1B]">⚡ {o.vacant} spot{o.vacant === 1 ? '' : 's'} open</span>
                  <Button size="sm" loading={busy === o.requirementId} onClick={() => act(o.requirementId, () => api.planner.worker.claim(o.requirementId), 'Shift claimed — added to My Shifts.')}>
                    Claim shift
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
