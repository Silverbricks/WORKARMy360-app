'use client';

import { type FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type {
  HrOverview,
  LeaveRequest,
  OnboardingCase,
  PerformanceReview,
  Warning,
} from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

type Tab = 'overview' | 'leave' | 'docs' | 'reviews' | 'onboarding' | 'warnings';
const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'leave', label: 'Leave' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'warnings', label: 'Warnings' },
  { key: 'docs', label: 'Documents' },
];

const selectCls =
  'h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]';

export function HrSection() {
  const tabParam = (useSearchParams().get('tab') as Tab) || 'overview';
  const tab: Tab = TABS.some((t) => t.key === tabParam) ? tabParam : 'overview';
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Human Resources</h1>
      <div className="flex flex-wrap gap-1 border-b border-[#E5E7EB]">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === 'overview' ? '/dashboard/hr' : `/dashboard/hr?tab=${t.key}`}
            className={cn('border-b-2 px-3.5 py-2 text-sm font-medium', tab === t.key ? '' : 'border-transparent text-[#94A3B8]')}
            style={tab === t.key ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}
          >
            {t.label}
          </Link>
        ))}
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {tab === 'overview' ? <Overview /> : null}
      {tab === 'leave' ? <Leave setError={setError} /> : null}
      {tab === 'reviews' ? <Reviews setError={setError} /> : null}
      {tab === 'onboarding' ? <Onboarding setError={setError} /> : null}
      {tab === 'warnings' ? <Warnings setError={setError} /> : null}
      {tab === 'docs' ? (
        <Card className="p-8 text-center text-sm text-[#64748B]">
          HR documents (contracts, handbooks, policies) live in{' '}
          <Link href="/dashboard/documents" style={{ color: 'var(--accent)' }}>
            Documents
          </Link>
          .
        </Card>
      ) : null}
    </div>
  );
}

function Overview() {
  const [o, setO] = useState<HrOverview | null>(null);
  useEffect(() => {
    api.hr.overview().then(setO).catch(() => {});
  }, []);
  const cards: { label: string; value: number; href: string }[] = [
    { label: 'Leave requests', value: o?.pendingLeave ?? 0, href: '/dashboard/hr?tab=leave' },
    { label: 'Reviews', value: o?.reviews ?? 0, href: '/dashboard/hr?tab=reviews' },
    { label: 'Onboarding', value: o?.onboarding ?? 0, href: '/dashboard/hr?tab=onboarding' },
    { label: 'Warnings', value: o?.warnings ?? 0, href: '/dashboard/hr?tab=warnings' },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Link key={c.label} href={c.href}>
          <Card className="p-5 transition hover:shadow-md">
            <p className="text-2xl font-semibold text-[#1E293B]">{c.value}</p>
            <p className="mt-1 text-xs text-[#64748B]">{c.label}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function Leave({ setError }: { setError: (s: string | null) => void }) {
  const [rows, setRows] = useState<LeaveRequest[]>([]);
  const [f, setF] = useState({ personName: '', type: 'ANNUAL', startDate: '', endDate: '' });
  const load = () => api.hr.leave.list().then(setRows).catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function add(e: FormEvent) {
    e.preventDefault();
    if (!f.personName || !f.startDate || !f.endDate) return setError('Name and dates required.');
    try {
      await api.hr.leave.create({ ...f, type: f.type as LeaveRequest['type'] });
      setF({ personName: '', type: 'ANNUAL', startDate: '', endDate: '' });
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    }
  }
  async function decide(id: string, status: 'APPROVED' | 'DECLINED') {
    try {
      await api.hr.leave.decide(id, { status });
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  const tone: Record<string, string> = { REQUESTED: 'bg-[#FEF3C7] text-[#92400E]', APPROVED: 'bg-[#DCFCE7] text-[#166534]', DECLINED: 'bg-[#FEE2E2] text-[#991B1B]', CANCELLED: 'bg-[#F1F5F9] text-[#64748B]' };
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto] sm:items-end">
          <Field id="lName" label="Staff"><Input id="lName" value={f.personName} onChange={(e) => setF({ ...f, personName: e.target.value })} placeholder="Name" /></Field>
          <Field id="lType" label="Type"><select id="lType" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className={selectCls}>{['ANNUAL', 'SICK', 'UNPAID', 'OTHER'].map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field id="lFrom" label="From"><Input id="lFrom" type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></Field>
          <Field id="lTo" label="To"><Input id="lTo" type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} /></Field>
          <Button type="submit">+ Add</Button>
        </form>
      </Card>
      {rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#94A3B8]">No leave requests.</Card>
      ) : (
        <Card className="p-4"><ul className="divide-y divide-[#E5E7EB]">{rows.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
            <div className="min-w-0 flex-1"><p className="font-medium text-[#1E293B]">{l.personName} — {l.type} leave</p><p className="text-xs text-[#64748B]">{l.startDate} → {l.endDate}</p></div>
            {l.status === 'REQUESTED' ? (<><Button size="sm" variant="ghost" onClick={() => decide(l.id, 'APPROVED')}>Approve</Button><Button size="sm" variant="ghost" onClick={() => decide(l.id, 'DECLINED')}>Decline</Button></>) : (<span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone[l.status]}`}>{l.status}</span>)}
          </li>
        ))}</ul></Card>
      )}
    </div>
  );
}

function Reviews({ setError }: { setError: (s: string | null) => void }) {
  const [rows, setRows] = useState<PerformanceReview[]>([]);
  const [f, setF] = useState({ personName: '', rating: 5, comments: '' });
  const load = () => api.hr.reviews.list().then(setRows).catch((e) => setError(errorMessage(e)));
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, []);
  async function add(e: FormEvent) {
    e.preventDefault();
    if (!f.personName) return setError('Name required.');
    try { await api.hr.reviews.create(f); setF({ personName: '', rating: 5, comments: '' }); await load(); } catch (e2) { setError(errorMessage(e2)); }
  }
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1.2fr_0.6fr_1.6fr_auto] sm:items-end">
          <Field id="rName" label="Staff"><Input id="rName" value={f.personName} onChange={(e) => setF({ ...f, personName: e.target.value })} /></Field>
          <Field id="rRate" label="Rating"><select id="rRate" value={String(f.rating)} onChange={(e) => setF({ ...f, rating: Number(e.target.value) })} className={selectCls}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}</select></Field>
          <Field id="rNote" label="Comments"><Input id="rNote" value={f.comments} onChange={(e) => setF({ ...f, comments: e.target.value })} /></Field>
          <Button type="submit">+ Add</Button>
        </form>
      </Card>
      {rows.length === 0 ? <Card className="p-8 text-center text-sm text-[#94A3B8]">No reviews yet.</Card> : (
        <Card className="p-4"><ul className="divide-y divide-[#E5E7EB]">{rows.map((r) => (
          <li key={r.id} className="py-3 text-sm"><p className="font-medium text-[#1E293B]">{r.personName} — <span className="text-[#F59E0B]">{'★'.repeat(r.rating)}</span></p>{r.comments ? <p className="text-xs text-[#64748B]">{r.comments}</p> : null}</li>
        ))}</ul></Card>
      )}
    </div>
  );
}

function Onboarding({ setError }: { setError: (s: string | null) => void }) {
  const [rows, setRows] = useState<OnboardingCase[]>([]);
  const [f, setF] = useState({ personName: '', kind: 'ONBOARDING', step: '' });
  const load = () => api.hr.onboarding.list().then(setRows).catch((e) => setError(errorMessage(e)));
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, []);
  async function add(e: FormEvent) {
    e.preventDefault();
    if (!f.personName) return setError('Name required.');
    try { await api.hr.onboarding.create({ ...f, kind: f.kind as OnboardingCase['kind'] }); setF({ personName: '', kind: 'ONBOARDING', step: '' }); await load(); } catch (e2) { setError(errorMessage(e2)); }
  }
  async function complete(id: string) { try { await api.hr.onboarding.setStatus(id, { status: 'COMPLETE' }); await load(); } catch (e) { setError(errorMessage(e)); } }
  const tone: Record<string, string> = { NOT_STARTED: 'bg-[#F1F5F9] text-[#64748B]', IN_PROGRESS: 'bg-[#FEF3C7] text-[#92400E]', COMPLETE: 'bg-[#DCFCE7] text-[#166534]' };
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1.2fr_1fr_1.4fr_auto] sm:items-end">
          <Field id="oName" label="Person"><Input id="oName" value={f.personName} onChange={(e) => setF({ ...f, personName: e.target.value })} /></Field>
          <Field id="oKind" label="Type"><select id="oKind" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className={selectCls}>{['ONBOARDING', 'OFFBOARDING'].map((k) => <option key={k}>{k}</option>)}</select></Field>
          <Field id="oStep" label="Current step"><Input id="oStep" value={f.step} onChange={(e) => setF({ ...f, step: e.target.value })} placeholder="Docs & ID" /></Field>
          <Button type="submit">+ Start</Button>
        </form>
      </Card>
      {rows.length === 0 ? <Card className="p-8 text-center text-sm text-[#94A3B8]">No active onboarding.</Card> : (
        <Card className="p-4"><ul className="divide-y divide-[#E5E7EB]">{rows.map((o) => (
          <li key={o.id} className="flex items-center gap-3 py-3 text-sm">
            <div className="min-w-0 flex-1"><p className="font-medium text-[#1E293B]">{o.personName}</p><p className="text-xs text-[#64748B]">{o.kind} · {o.step || '—'}</p></div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone[o.status]}`}>{o.status.replace('_', ' ')}</span>
            {o.status !== 'COMPLETE' ? <Button size="sm" variant="ghost" onClick={() => complete(o.id)}>Complete</Button> : null}
          </li>
        ))}</ul></Card>
      )}
    </div>
  );
}

function Warnings({ setError }: { setError: (s: string | null) => void }) {
  const [rows, setRows] = useState<Warning[]>([]);
  const [f, setF] = useState({ personName: '', kind: 'WARNING', severity: 'LOW', summary: '' });
  const load = () => api.hr.warnings.list().then(setRows).catch((e) => setError(errorMessage(e)));
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, []);
  async function add(e: FormEvent) {
    e.preventDefault();
    if (!f.personName || !f.summary) return setError('Name and summary required.');
    try { await api.hr.warnings.create({ ...f, kind: f.kind as Warning['kind'], severity: f.severity as Warning['severity'] }); setF({ personName: '', kind: 'WARNING', severity: 'LOW', summary: '' }); await load(); } catch (e2) { setError(errorMessage(e2)); }
  }
  const sev: Record<string, string> = { LOW: 'bg-[#F1F5F9] text-[#64748B]', MEDIUM: 'bg-[#FEF3C7] text-[#92400E]', HIGH: 'bg-[#FEE2E2] text-[#991B1B]' };
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
          <Field id="wName" label="Staff"><Input id="wName" value={f.personName} onChange={(e) => setF({ ...f, personName: e.target.value })} /></Field>
          <Field id="wSev" label="Severity"><select id="wSev" value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value })} className={selectCls}>{['LOW', 'MEDIUM', 'HIGH'].map((s) => <option key={s}>{s}</option>)}</select></Field>
          <div className="sm:col-span-2"><Field id="wSum" label="Summary"><Input id="wSum" value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} placeholder="What happened" /></Field></div>
          <div className="sm:col-span-2"><Button type="submit">+ Log</Button></div>
        </form>
      </Card>
      {rows.length === 0 ? <Card className="p-8 text-center text-sm text-[#94A3B8]">No warnings logged.</Card> : (
        <Card className="p-4"><ul className="divide-y divide-[#E5E7EB]">{rows.map((w) => (
          <li key={w.id} className="flex items-center gap-3 py-3 text-sm">
            <Icon name="alertTriangle" size={16} className="text-[#92400E]" />
            <div className="min-w-0 flex-1"><p className="font-medium text-[#1E293B]">{w.personName} — {w.summary}</p><p className="text-xs text-[#64748B]">{w.kind}{w.occurredAt ? ` · ${w.occurredAt}` : ''}</p></div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sev[w.severity]}`}>{w.severity}</span>
          </li>
        ))}</ul></Card>
      )}
    </div>
  );
}
