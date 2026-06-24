'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type {
  BecomeProviderInput,
  EmployerSummary,
  Payslip,
  TimesheetView,
  WorkerShift,
} from '@workarmy/types';
import { Alert, Button, Card, Field, Input, cn, formatCurrencyAUD } from '@workarmy/ui';
import { api, PROVIDERS_URL } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { useTabParam } from '@/lib/use-tab-param';

type Tab = 'shifts' | 'timesheets' | 'payslips' | 'employers';
const WORK_TABS = ['shifts', 'timesheets', 'payslips', 'employers'] as const;

const inputCls =
  'h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]';

const tsTone: Record<string, string> = {
  DRAFT: 'bg-[#F1F5F9] text-[#64748B]',
  SUBMITTED: 'bg-[#FEF9C3] text-[#854D0E]',
  APPROVED: 'bg-[#DCFCE7] text-[#166534]',
  REJECTED: 'bg-[#FEE2E2] text-[#991B1B]',
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
function fmtTime(iso: string | null): string {
  return iso ? new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : '—';
}

function getPosition(): Promise<{ lat?: number; lng?: number }> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve({});
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve({}),
      { timeout: 5000 },
    );
  });
}

export function WorkSection() {
  const [tab, setTab] = useTabParam<Tab>(WORK_TABS, 'shifts');
  const [shifts, setShifts] = useState<WorkerShift[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetView[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [employers, setEmployers] = useState<EmployerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function loadAll() {
    const [s, t, p, e] = await Promise.all([
      api.work.myShifts(),
      api.work.myTimesheets(),
      api.work.myPayslips(),
      api.persons.employers(),
    ]);
    setShifts(s);
    setTimesheets(t);
    setPayslips(p);
    setEmployers(e);
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
    setInfo(null);
    try {
      await fn();
      await loadAll();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function clockIn(id: string) {
    const pos = await getPosition();
    await act(id, () => api.work.clockIn(id, pos));
  }
  async function clockOut(id: string) {
    const pos = await getPosition();
    await act(id, () => api.work.clockOut(id, pos));
  }
  async function generateTimesheet() {
    setBusy('gen');
    setError(null);
    setInfo(null);
    try {
      await api.work.generateTimesheet();
      setInfo('This week’s timesheet was generated and submitted.');
      await loadAll();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  const current = shifts.filter((s) => s.status !== 'COMPLETED' && s.shift.status !== 'CANCELLED');

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'shifts', label: 'Shifts', count: shifts.length },
    { key: 'timesheets', label: 'Timesheets', count: timesheets.length },
    { key: 'payslips', label: 'Payslips', count: payslips.length },
    { key: 'employers', label: 'My employers', count: employers.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Work &amp; Earnings</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">Shifts, attendance, timesheets and payslips.</p>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {info ? <Alert tone="success">{info}</Alert> : null}

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

      {tab === 'shifts' &&
        (shifts.length === 0 ? (
          <Card className="p-6 text-sm text-[#64748B]">No shifts assigned yet.</Card>
        ) : (
          <div className="space-y-3">
            {shifts.map((s) => {
              const a = s.attendance;
              const clockedIn = !!a?.clockInAt && !a?.clockOutAt;
              const done = !!a?.clockOutAt;
              return (
                <Card key={s.assignmentId} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-[#1E293B]">{s.shift.title}</div>
                      <div className="mt-0.5 text-sm text-[#64748B]">
                        {[s.org.name, s.shift.location, s.shift.state].filter(Boolean).join(' · ')}
                      </div>
                      <div className="mt-0.5 text-sm text-[#64748B]">
                        {fmt(s.shift.startAt)} – {fmtTime(s.shift.endAt)}
                        {s.shift.payRate ? ` · $${s.shift.payRate}/${s.shift.payUnit ?? 'hr'}` : ''}
                      </div>
                      {a?.clockInAt ? (
                        <div className="mt-1 text-xs text-[#64748B]">
                          Clocked in {fmtTime(a.clockInAt)} · out {fmtTime(a.clockOutAt)}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {s.status === 'ASSIGNED' ? (
                        <Button size="sm" variant="secondary" loading={busy === s.assignmentId} onClick={() => act(s.assignmentId, () => api.work.confirm(s.assignmentId))}>
                          Confirm
                        </Button>
                      ) : null}
                      {!done && !clockedIn ? (
                        <Button size="sm" loading={busy === s.assignmentId} onClick={() => clockIn(s.assignmentId)}>Clock in</Button>
                      ) : null}
                      {clockedIn ? (
                        <Button size="sm" loading={busy === s.assignmentId} onClick={() => clockOut(s.assignmentId)}>Clock out</Button>
                      ) : null}
                      {s.status !== 'SWAP_REQUESTED' && !done ? (
                        <Button size="sm" variant="ghost" onClick={() => act(s.assignmentId, () => api.work.requestSwap(s.assignmentId))}>Swap</Button>
                      ) : null}
                      <span className="self-center rounded-full bg-[#F1F5F9] px-2 py-0.5 text-xs text-[#64748B]">{s.status}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ))}

      {tab === 'timesheets' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button loading={busy === 'gen'} onClick={generateTimesheet}>Generate this week</Button>
          </div>
          {timesheets.length === 0 ? (
            <Card className="p-6 text-sm text-[#64748B]">No timesheets yet. Clock out of a shift, then generate this week’s timesheet.</Card>
          ) : (
            timesheets.map((t) => (
              <Card key={t.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-[#1E293B]">Week of {t.weekStart}{t.org ? ` · ${t.org.name}` : ''}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#64748B]">{t.totalHours} hrs</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tsTone[t.status]}`}>{t.status}</span>
                  </div>
                </div>
                {t.entries.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm text-[#64748B]">
                    {t.entries.map((e) => (
                      <li key={e.id} className="flex justify-between">
                        <span>{e.date}{e.note ? ` · ${e.note}` : ''}</span>
                        <span>{e.hours} hrs</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'payslips' &&
        (payslips.length === 0 ? (
          <Card className="p-6 text-sm text-[#64748B]">No payslips yet.</Card>
        ) : (
          <div className="space-y-3">
            {payslips.map((p) => (
              <Card key={p.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-[#1E293B]">
                    {p.periodStart} – {p.periodEnd}{p.org ? ` · ${p.org.name}` : ''}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-[#1E293B]">{formatCurrencyAUD(p.netPay)}</div>
                    <div className="text-xs text-[#64748B]">net</div>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-[#64748B] sm:grid-cols-4">
                  <div>Hours: {p.hours}</div>
                  <div>Gross: {formatCurrencyAUD(p.grossPay)}</div>
                  <div>Tax: {formatCurrencyAUD(p.tax)}</div>
                  <div>Super: {formatCurrencyAUD(p.superannuation)}</div>
                </div>
              </Card>
            ))}
          </div>
        ))}

      {tab === 'employers' && <EmployersTab employers={employers} />}
    </div>
  );
}

function EmployersTab({ employers }: { employers: EmployerSummary[] }) {
  const [showForm, setShowForm] = useState(false);
  const [accountType, setAccountType] = useState<BecomeProviderInput['accountType']>('EMPLOYER');
  const [companyName, setCompanyName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.persons.becomeProvider({ accountType, companyName });
      setDone(true);
      setShowForm(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {employers.length === 0 ? (
        <Card className="p-6 text-sm text-[#64748B]">No employers yet. Once you’re hired or assigned a shift, your employers appear here.</Card>
      ) : (
        <div className="space-y-3">
          {employers.map((e) => (
            <Card key={e.orgId} className="flex items-center justify-between gap-3 p-5">
              <div>
                <div className="font-medium text-[#1E293B]">{e.name}</div>
                <div className="text-sm text-[#64748B]">{e.shiftsCount} shift{e.shiftsCount === 1 ? '' : 's'}</div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${e.current ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                {e.current ? 'Current' : 'Previous'}
              </span>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-[#1E293B]">Become a provider</h2>
        <p className="mt-0.5 text-sm text-[#64748B]">Hiring workers yourself? Create a provider organisation.</p>
        {error ? <div className="mt-3"><Alert tone="error">{error}</Alert></div> : null}
        {done ? (
          <div className="mt-3">
            <Alert tone="success">
              Your provider organisation is ready.{' '}
              <a href={PROVIDERS_URL} className="font-medium underline">Open the Providers app</a> (log in with the same account).
            </Alert>
          </div>
        ) : showForm ? (
          <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="orgType" label="Organisation type">
              <select id="orgType" value={accountType} onChange={(e) => setAccountType(e.target.value as BecomeProviderInput['accountType'])} className={inputCls}>
                <option value="EMPLOYER">Employer</option>
                <option value="FARM">Farm</option>
                <option value="CONTRACTOR">Contractor</option>
                <option value="LABOUR_HIRE">Labour Hire</option>
                <option value="RECRUITMENT_AGENCY">Recruitment Agency</option>
              </select>
            </Field>
            <Field id="orgName" label="Organisation name">
              <Input id="orgName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" loading={busy}>Create organisation</Button>
            </div>
          </form>
        ) : (
          <div className="mt-4">
            <Button type="button" variant="secondary" onClick={() => setShowForm(true)}>Become a provider</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
