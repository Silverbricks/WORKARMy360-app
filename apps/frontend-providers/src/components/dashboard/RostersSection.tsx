'use client';

import { type FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { RosterShift, WhosTurningUpDay } from '@workarmy/types';
import { Alert, Button, Card, Field, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

const respTone: Record<string, string> = {
  ACCEPTED: 'bg-[#DCFCE7] text-[#166534]',
  CONFIRMED: 'bg-[#DCFCE7] text-[#166534]',
  COMPLETED: 'bg-[#DCFCE7] text-[#166534]',
  DECLINED: 'bg-[#FEF3C7] text-[#92400E]',
  NO_SHOW: 'bg-[#FEE2E2] text-[#991B1B]',
  ASSIGNED: 'bg-[#F1F5F9] text-[#64748B]',
};

export function RostersSection() {
  const turnup = useSearchParams().get('tab') === 'turnup';
  return turnup ? <TurnUp /> : <Builder />;
}

function Builder() {
  const [rosters, setRosters] = useState<RosterShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', date: '', start: '06:00', end: '14:00', who: '' });
  const [busy, setBusy] = useState(false);
  const [assignTo, setAssignTo] = useState<string | null>(null);
  const [assignWa, setAssignWa] = useState('');

  async function load() {
    setRosters(await api.staff.rosters.list());
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.staff.rosters.list();
        if (active) setRosters(data);
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

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.date) {
      setError('Enter a title and date.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const waIds = form.who.split(',').map((s) => s.trim()).filter(Boolean);
      await api.staff.rosters.create({ title: form.title, date: form.date, start: form.start, end: form.end, waIds });
      setForm({ title: '', date: '', start: '06:00', end: '14:00', who: '' });
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  }

  async function respond(assignmentId: string, response: 'ACCEPTED' | 'DECLINED') {
    try {
      await api.staff.rosters.respond(assignmentId, { response });
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function publish(id: string) {
    try {
      await api.staff.rosters.publish(id);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function assign(id: string) {
    if (!assignWa.trim()) return;
    try {
      await api.staff.rosters.assign(id, { waId: assignWa });
      setAssignWa('');
      setAssignTo(null);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl">Rosters</h1>
        <Link href="/dashboard/rosters?tab=turnup">
          <Button variant="secondary">Who&apos;s turning up →</Button>
        </Link>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Card className="p-5">
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr] sm:items-end">
          <Field id="rTitle" label="Shift / role">
            <Input id="rTitle" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Picking — Block 4" />
          </Field>
          <Field id="rDate" label="Date">
            <Input id="rDate" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field id="rStart" label="Start">
            <Input id="rStart" type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </Field>
          <Field id="rEnd" label="End">
            <Input id="rEnd" type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
          </Field>
          <div className="sm:col-span-4">
            <Field id="rWho" label="Assign workers (WA-IDs, comma-separated — optional)">
              <Input id="rWho" value={form.who} onChange={(e) => setForm({ ...form, who: e.target.value })} placeholder="WA100123, WA100456" />
            </Field>
          </div>
          <div className="sm:col-span-4">
            <Button type="submit" loading={busy}>+ Add roster shift</Button>
          </div>
        </form>
      </Card>

      {rosters.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#94A3B8]">No roster shifts yet.</Card>
      ) : (
        <div className="space-y-3">
          {rosters.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-[#1E293B]">{r.title}</p>
                  <p className="text-xs text-[#64748B]">
                    {r.date} · {r.start}–{r.end} · {r.assignments.length} rostered
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setAssignTo(assignTo === r.id ? null : r.id)}>+ Assign</Button>
                  {!r.published ? (
                    <Button size="sm" onClick={() => publish(r.id)}>Publish &amp; notify</Button>
                  ) : (
                    <span className="self-center rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-medium text-[#166534]">Published</span>
                  )}
                </div>
              </div>

              {assignTo === r.id ? (
                <div className="mt-3 flex items-end gap-2">
                  <Input value={assignWa} onChange={(e) => setAssignWa(e.target.value)} placeholder="Worker WA-ID" className="max-w-[180px]" />
                  <Button size="sm" onClick={() => assign(r.id)}>Add</Button>
                </div>
              ) : null}

              {r.assignments.length > 0 ? (
                <ul className="mt-3 divide-y divide-[#F1F5F9]">
                  {r.assignments.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                      <span className="flex-1 text-[#1E293B]">
                        {a.name} <span className="font-mono text-xs text-[#94A3B8]">{a.waId}</span>
                      </span>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', respTone[a.status] ?? respTone.ASSIGNED)}>
                        {a.status}
                      </span>
                      <button type="button" onClick={() => respond(a.id, 'ACCEPTED')} className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                        ✓ Accept
                      </button>
                      <button type="button" onClick={() => respond(a.id, 'DECLINED')} className="text-xs font-medium text-[#92400E]">
                        ✕ Decline
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>
          ))}
          <p className="text-xs text-[#94A3B8]">
            Workers accept/reject from their own app — the Accept/Decline buttons here simulate that so you can see how
            the roster and Who&apos;s Turning Up update.
          </p>
        </div>
      )}
    </div>
  );
}

function TurnUp() {
  const [days, setDays] = useState<WhosTurningUpDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.staff.rosters.turnup();
        if (active) setDays(data);
      } catch (e) {
        if (active) setError(errorMessage(e));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl">Who&apos;s Turning Up</h1>
        <Link href="/dashboard/rosters">
          <Button variant="secondary">← Rosters</Button>
        </Link>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {days === null ? (
        <div className="py-10 text-center text-sm text-[#64748B]">Loading…</div>
      ) : days.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#94A3B8]">No rostered shifts yet.</Card>
      ) : (
        days.map((d) => {
          const gap = d.declined > 0 || d.pending > 0;
          return (
            <Card key={d.date} className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium text-[#1E293B]">{d.date}</p>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    gap ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#DCFCE7] text-[#166534]',
                  )}
                >
                  {d.confirmed} coming{d.pending ? ` · ${d.pending} pending` : ''}{d.declined ? ` · ${d.declined} gap` : ''}
                </span>
              </div>
              <ul className="divide-y divide-[#F1F5F9]">
                {d.assignments.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 py-2 text-sm">
                    <span className="flex-1 text-[#1E293B]">{a.name}</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', respTone[a.status] ?? respTone.ASSIGNED)}>
                      {a.status}
                    </span>
                  </li>
                ))}
              </ul>
              {d.declined > 0 ? (
                <p className="mt-2 rounded-lg bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
                  ⚠ {d.declined} declined —{' '}
                  <Link href="/dashboard/staffing?tab=urgent" style={{ color: 'var(--accent)' }}>
                    raise a replacement
                  </Link>
                  .
                </p>
              ) : null}
            </Card>
          );
        })
      )}
    </div>
  );
}
