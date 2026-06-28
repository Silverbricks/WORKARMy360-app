'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Payslip, PayslipInput, ShiftInput, ShiftWithAssignments, TimesheetView } from '@workarmy/types';
import { Alert, Button, Card, Field, Input, cn, formatCurrencyAUD } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

type Tab = 'shifts' | 'timesheets' | 'payslips';

const inputCls =
  'h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]';

const EMPTY_SHIFT: ShiftInput = { title: '', startAt: '', endAt: '', location: '', state: '', positions: 1 };
const EMPTY_PAY: PayslipInput = { personWaId: '', periodStart: '', periodEnd: '' };

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function fmtTime(iso: string | null): string {
  return iso ? new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : '—';
}

export function WorkforceSection() {
  // Honour the nav deep-links: ?tab=timesheets / ?tab=attendance (→ shifts) etc.
  const tabParam = useSearchParams().get('tab');
  const initialTab: Tab = tabParam === 'timesheets' ? 'timesheets' : tabParam === 'payslips' ? 'payslips' : 'shifts';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [shifts, setShifts] = useState<ShiftWithAssignments[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetView[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showShiftForm, setShowShiftForm] = useState(false);
  const [shiftForm, setShiftForm] = useState<ShiftInput>(EMPTY_SHIFT);
  const [assignWa, setAssignWa] = useState<Record<string, string>>({});
  const [payForm, setPayForm] = useState<PayslipInput>(EMPTY_PAY);

  async function loadAll() {
    const [s, t, p] = await Promise.all([
      api.work.listShifts(),
      api.work.orgTimesheets(),
      api.work.orgPayslips(),
    ]);
    setShifts(s);
    setTimesheets(t);
    setPayslips(p);
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

  async function act(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
      await loadAll();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function createShift(e: FormEvent) {
    e.preventDefault();
    await act('create', async () => {
      await api.work.createShift(shiftForm);
      setShiftForm(EMPTY_SHIFT);
      setShowShiftForm(false);
    });
  }

  async function assign(shiftId: string) {
    const waId = (assignWa[shiftId] ?? '').trim();
    if (!waId) return;
    await act(`assign-${shiftId}`, async () => {
      await api.work.assign(shiftId, { waId });
      setAssignWa((m) => ({ ...m, [shiftId]: '' }));
    });
  }

  async function issuePayslip(e: FormEvent) {
    e.preventDefault();
    await act('pay', async () => {
      await api.work.issuePayslip(payForm);
      setPayForm(EMPTY_PAY);
    });
  }

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'shifts', label: 'Shifts', count: shifts.length },
    { key: 'timesheets', label: 'Timesheets', count: timesheets.length },
    { key: 'payslips', label: 'Payslips', count: payslips.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Shifts &amp; Pay</h1>
        {tab === 'shifts' ? (
          <Button onClick={() => setShowShiftForm((s) => !s)}>{showShiftForm ? 'Cancel' : 'Create shift'}</Button>
        ) : null}
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn('rounded-lg px-3 py-1.5 text-sm', tab === t.key ? 'text-white' : 'bg-[#F1F5F9] text-[#64748B]')}
            style={tab === t.key ? { backgroundColor: 'var(--accent)' } : undefined}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tab === 'shifts' && (
        <>
          {showShiftForm ? (
            <Card className="p-6">
              <form onSubmit={createShift} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field id="title" label="Shift title">
                    <Input id="title" value={shiftForm.title} onChange={(e) => setShiftForm({ ...shiftForm, title: e.target.value })} />
                  </Field>
                </div>
                <Field id="startAt" label="Start">
                  <input id="startAt" type="datetime-local" value={shiftForm.startAt} onChange={(e) => setShiftForm({ ...shiftForm, startAt: e.target.value })} className={inputCls} />
                </Field>
                <Field id="endAt" label="End">
                  <input id="endAt" type="datetime-local" value={shiftForm.endAt} onChange={(e) => setShiftForm({ ...shiftForm, endAt: e.target.value })} className={inputCls} />
                </Field>
                <Field id="location" label="Location">
                  <Input id="location" value={shiftForm.location ?? ''} onChange={(e) => setShiftForm({ ...shiftForm, location: e.target.value })} />
                </Field>
                <Field id="state" label="State">
                  <Input id="state" value={shiftForm.state ?? ''} onChange={(e) => setShiftForm({ ...shiftForm, state: e.target.value })} placeholder="VIC / NSW" />
                </Field>
                <Field id="payRate" label="Pay rate ($/hr)">
                  <Input id="payRate" type="number" value={shiftForm.payRate ?? ''} onChange={(e) => setShiftForm({ ...shiftForm, payRate: e.target.value ? Number(e.target.value) : undefined })} />
                </Field>
                <Field id="positions" label="Positions">
                  <Input id="positions" type="number" value={shiftForm.positions ?? 1} onChange={(e) => setShiftForm({ ...shiftForm, positions: Number(e.target.value) })} />
                </Field>
                <div className="sm:col-span-2">
                  <Button type="submit" loading={busy === 'create'}>Create shift</Button>
                </div>
              </form>
            </Card>
          ) : null}

          {shifts.length === 0 ? (
            <Card className="p-6 text-sm text-[#64748B]">No shifts yet. Create one to roster workers.</Card>
          ) : (
            <div className="space-y-3">
              {shifts.map((s) => (
                <Card key={s.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#1E293B]">{s.title}</span>
                        <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-xs text-[#64748B]">{s.status}</span>
                      </div>
                      <div className="mt-0.5 text-sm text-[#64748B]">
                        {fmt(s.startAt)} – {fmtTime(s.endAt)}
                        {[s.location, s.state].filter(Boolean).length ? ` · ${[s.location, s.state].filter(Boolean).join(', ')}` : ''}
                        {s.payRate ? ` · $${s.payRate}/${s.payUnit ?? 'hr'}` : ''}
                      </div>
                    </div>
                    {s.status !== 'CANCELLED' ? (
                      <Button size="sm" variant="ghost" onClick={() => act(`cancel-${s.id}`, () => api.work.cancelShift(s.id))}>Cancel shift</Button>
                    ) : null}
                  </div>

                  <div className="mt-4 border-t border-[#E5E7EB] pt-4">
                    {s.assignments.length === 0 ? (
                      <p className="text-sm text-[#64748B]">No workers assigned.</p>
                    ) : (
                      <ul className="space-y-2">
                        {s.assignments.map((a) => (
                          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span className="text-[#1E293B]">
                              {[a.person.firstName, a.person.lastName].filter(Boolean).join(' ') || a.person.waId}{' '}
                              <span className="font-mono text-xs text-[#94A3B8]">{a.person.waId}</span>
                              <span className="ml-2 text-xs text-[#64748B]">{a.status}</span>
                              {a.attendance?.clockInAt ? (
                                <span className="ml-2 text-xs text-[#64748B]">in {fmtTime(a.attendance.clockInAt)} · out {fmtTime(a.attendance.clockOutAt)}</span>
                              ) : null}
                            </span>
                            <button type="button" onClick={() => act(`un-${a.id}`, () => api.work.unassign(a.id))} className="text-xs text-[#DC2626] hover:underline">Remove</button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {s.status !== 'CANCELLED' ? (
                      <div className="mt-3 flex items-center gap-2">
                        <Input
                          value={assignWa[s.id] ?? ''}
                          onChange={(e) => setAssignWa((m) => ({ ...m, [s.id]: e.target.value }))}
                          placeholder="Worker WA ID (e.g. WA100001)"
                          className="max-w-xs"
                        />
                        <Button size="sm" variant="secondary" loading={busy === `assign-${s.id}`} onClick={() => assign(s.id)}>Assign</Button>
                      </div>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'timesheets' &&
        (timesheets.length === 0 ? (
          <Card className="p-6 text-sm text-[#64748B]">No timesheets submitted yet.</Card>
        ) : (
          <div className="space-y-3">
            {timesheets.map((t) => (
              <Card key={t.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium text-[#1E293B]">{t.person?.name ?? 'Worker'} · week of {t.weekStart}</div>
                    <div className="text-sm text-[#64748B]">{t.totalHours} hrs · {t.status}</div>
                  </div>
                  {t.status === 'SUBMITTED' ? (
                    <div className="flex gap-2">
                      <Button size="sm" loading={busy === `ap-${t.id}`} onClick={() => act(`ap-${t.id}`, () => api.work.approveTimesheet(t.id))}>Approve</Button>
                      <Button size="sm" variant="ghost" loading={busy === `re-${t.id}`} onClick={() => act(`re-${t.id}`, () => api.work.rejectTimesheet(t.id))}>Reject</Button>
                    </div>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        ))}

      {tab === 'payslips' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold text-[#1E293B]">Issue a payslip</h2>
            <form onSubmit={issuePayslip} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field id="waId" label="Worker WA ID">
                <Input id="waId" value={payForm.personWaId} onChange={(e) => setPayForm({ ...payForm, personWaId: e.target.value })} />
              </Field>
              <Field id="ps" label="Period start">
                <input id="ps" type="date" value={payForm.periodStart} onChange={(e) => setPayForm({ ...payForm, periodStart: e.target.value })} className={inputCls} />
              </Field>
              <Field id="pe" label="Period end">
                <input id="pe" type="date" value={payForm.periodEnd} onChange={(e) => setPayForm({ ...payForm, periodEnd: e.target.value })} className={inputCls} />
              </Field>
              <Field id="hrs" label="Hours">
                <Input id="hrs" type="number" value={payForm.hours ?? ''} onChange={(e) => setPayForm({ ...payForm, hours: e.target.value ? Number(e.target.value) : undefined })} />
              </Field>
              <Field id="gross" label="Gross ($)">
                <Input id="gross" type="number" value={payForm.grossPay ?? ''} onChange={(e) => setPayForm({ ...payForm, grossPay: e.target.value ? Number(e.target.value) : undefined })} />
              </Field>
              <Field id="net" label="Net ($)">
                <Input id="net" type="number" value={payForm.netPay ?? ''} onChange={(e) => setPayForm({ ...payForm, netPay: e.target.value ? Number(e.target.value) : undefined })} />
              </Field>
              <Field id="tax" label="Tax ($)">
                <Input id="tax" type="number" value={payForm.tax ?? ''} onChange={(e) => setPayForm({ ...payForm, tax: e.target.value ? Number(e.target.value) : undefined })} />
              </Field>
              <Field id="super" label="Super ($)">
                <Input id="super" type="number" value={payForm.superannuation ?? ''} onChange={(e) => setPayForm({ ...payForm, superannuation: e.target.value ? Number(e.target.value) : undefined })} />
              </Field>
              <div className="self-end">
                <Button type="submit" loading={busy === 'pay'}>Issue payslip</Button>
              </div>
            </form>
          </Card>

          {payslips.length === 0 ? (
            <Card className="p-6 text-sm text-[#64748B]">No payslips issued yet.</Card>
          ) : (
            <div className="space-y-3">
              {payslips.map((p) => (
                <Card key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-5">
                  <div>
                    <div className="font-medium text-[#1E293B]">{p.person?.name ?? 'Worker'}</div>
                    <div className="text-sm text-[#64748B]">{p.periodStart} – {p.periodEnd} · {p.hours} hrs</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[#1E293B]">{formatCurrencyAUD(p.netPay)}</div>
                    <div className="text-xs text-[#64748B]">net · gross {formatCurrencyAUD(p.grossPay)}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
