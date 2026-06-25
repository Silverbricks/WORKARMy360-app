'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { Site, SiteQrCode, Task, Visitor } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

const selectCls =
  'h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]';

// ---- Task Management ----
const TASK_STAGES: Task['status'][] = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETE'];
const taskTone: Record<string, string> = {
  ASSIGNED: 'bg-[#F1F5F9] text-[#64748B]',
  ACCEPTED: 'bg-[#DBEAFE] text-[#1E40AF]',
  IN_PROGRESS: 'bg-[#FEF3C7] text-[#92400E]',
  COMPLETE: 'bg-[#DCFCE7] text-[#166534]',
};

export function TasksSection() {
  const [rows, setRows] = useState<Task[]>([]);
  const [f, setF] = useState({ title: '', assigneeName: '', source: 'Internal', dueAt: '' });
  const [error, setError] = useState<string | null>(null);
  const load = () => api.operations.tasks.list().then(setRows).catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    void load();
  }, []);
  async function add(e: FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) return setError('Enter a task.');
    try {
      await api.operations.tasks.create(f);
      setF({ title: '', assigneeName: '', source: 'Internal', dueAt: '' });
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    }
  }
  async function advance(t: Task) {
    const next = TASK_STAGES[TASK_STAGES.indexOf(t.status) + 1];
    if (!next) return;
    try {
      await api.operations.tasks.setStatus(t.id, { status: next });
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Task Management</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Card className="p-5">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-[2fr_1.2fr_1fr_1fr_auto] sm:items-end">
          <Field id="tTitle" label="Task"><Input id="tTitle" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Pick Block 4 — 200 bins" /></Field>
          <Field id="tWho" label="Assign to"><Input id="tWho" value={f.assigneeName} onChange={(e) => setF({ ...f, assigneeName: e.target.value })} placeholder="Staff / team" /></Field>
          <Field id="tSrc" label="Source"><select id="tSrc" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} className={selectCls}>{['Internal', 'External', 'Third-party'].map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field id="tDue" label="Due"><Input id="tDue" type="date" value={f.dueAt} onChange={(e) => setF({ ...f, dueAt: e.target.value })} /></Field>
          <Button type="submit">+ Add</Button>
        </form>
      </Card>
      {rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#94A3B8]">No tasks yet.</Card>
      ) : (
        <Card className="p-4"><ul className="divide-y divide-[#E5E7EB]">{rows.map((t) => {
          const next = TASK_STAGES[TASK_STAGES.indexOf(t.status) + 1];
          return (
            <li key={t.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <div className="min-w-0 flex-1"><p className="font-medium text-[#1E293B]">{t.title}</p><p className="text-xs text-[#64748B]">→ {t.assigneeName || 'Unassigned'}{t.source ? ` · ${t.source}` : ''}{t.dueAt ? ` · due ${t.dueAt}` : ''}</p></div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${taskTone[t.status]}`}>{t.status.replace('_', ' ')}</span>
              {next ? <Button size="sm" variant="ghost" onClick={() => advance(t)}>→ {next.replace('_', ' ')}</Button> : null}
            </li>
          );
        })}</ul></Card>
      )}
    </div>
  );
}

// ---- QR Clock-In ----
function qrCells(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  let cells = '';
  for (let y = 0; y < 9; y++)
    for (let x = 0; x < 9; x++) {
      h = (h * 1103515245 + 12345) >>> 0;
      if ((h >> 16) & 1 || (x < 2 && y < 2) || (x > 6 && y < 2) || (x < 2 && y > 6))
        cells += `<rect x="${x * 10}" y="${y * 10}" width="10" height="10" fill="#1C1B1F"/>`;
    }
  return cells;
}

export function QrSection() {
  const [rows, setRows] = useState<SiteQrCode[]>([]);
  const [f, setF] = useState({ siteName: '', leaderName: '' });
  const [error, setError] = useState<string | null>(null);
  const load = () => api.operations.qr.list().then(setRows).catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    void load();
  }, []);
  async function create(e: FormEvent) {
    e.preventDefault();
    if (!f.siteName.trim()) return setError('Enter a site.');
    try {
      await api.operations.qr.create(f);
      setF({ siteName: '', leaderName: '' });
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    }
  }
  return (
    <div className="space-y-5">
      <h1 className="text-2xl">QR Clock-In</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Card className="p-5">
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-[1.5fr_1.5fr_auto] sm:items-end">
          <Field id="qSite" label="Site / location"><Input id="qSite" value={f.siteName} onChange={(e) => setF({ ...f, siteName: e.target.value })} placeholder="e.g. Cranbourne — Block 4" /></Field>
          <Field id="qLead" label="Manager / leader"><Input id="qLead" value={f.leaderName} onChange={(e) => setF({ ...f, leaderName: e.target.value })} placeholder="e.g. Sukhvir S." /></Field>
          <Button type="submit">Generate QR</Button>
        </form>
      </Card>
      {rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#94A3B8]">No QR codes yet — generate one above.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((q) => (
            <Card key={q.id} className="p-4 text-center">
              <svg viewBox="0 0 90 90" width="84" height="84" className="mx-auto rounded-lg border border-[#E5E7EB] bg-white" dangerouslySetInnerHTML={{ __html: qrCells(q.token) }} />
              <p className="mt-2 text-sm font-medium text-[#1E293B]">{q.siteName}</p>
              <p className="text-xs text-[#64748B]">Leader: {q.leaderName || '—'}</p>
              <p className="font-mono text-[11px] text-[#94A3B8]">{q.token}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Sites & Locations ----
export function SitesSection() {
  const [rows, setRows] = useState<Site[]>([]);
  const [f, setF] = useState({ name: '', addressLine: '', suburb: '', state: '' });
  const [error, setError] = useState<string | null>(null);
  const load = () => api.operations.sites.list().then(setRows).catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    void load();
  }, []);
  async function add(e: FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return setError('Enter a site name.');
    try {
      await api.operations.sites.create(f);
      setF({ name: '', addressLine: '', suburb: '', state: '' });
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    }
  }
  async function remove(id: string) {
    try {
      await api.operations.sites.remove(id);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Sites &amp; Locations</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Card className="p-5">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1.5fr_2fr_1fr_0.7fr_auto] sm:items-end">
          <Field id="sName" label="Site name"><Input id="sName" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Cranbourne Orchard" /></Field>
          <Field id="sAddr" label="Address"><Input id="sAddr" value={f.addressLine} onChange={(e) => setF({ ...f, addressLine: e.target.value })} /></Field>
          <Field id="sSub" label="Suburb"><Input id="sSub" value={f.suburb} onChange={(e) => setF({ ...f, suburb: e.target.value })} /></Field>
          <Field id="sState" label="State"><Input id="sState" value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })} /></Field>
          <Button type="submit">+ Add</Button>
        </form>
      </Card>
      {rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#94A3B8]">No sites yet.</Card>
      ) : (
        <Card className="p-4"><ul className="divide-y divide-[#E5E7EB]">{rows.map((s) => (
          <li key={s.id} className="flex items-center gap-3 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F1F5F9]"><Icon name="mapPin" size={16} /></span>
            <div className="min-w-0 flex-1"><p className="text-sm font-medium text-[#1E293B]">{s.name}</p><p className="truncate text-xs text-[#64748B]">{[s.addressLine, s.suburb, s.state].filter(Boolean).join(', ') || '—'}</p></div>
            <button type="button" onClick={() => remove(s.id)} className="text-[#94A3B8] hover:text-[#991B1B]" aria-label="Remove"><Icon name="trash" size={16} /></button>
          </li>
        ))}</ul></Card>
      )}
    </div>
  );
}

// ---- Visitor Management ----
export function VisitorsSection() {
  const [rows, setRows] = useState<Visitor[]>([]);
  const [f, setF] = useState({ name: '', kind: 'VISITOR', company: '', siteName: '' });
  const [error, setError] = useState<string | null>(null);
  const load = () => api.operations.visitors.list().then(setRows).catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    void load();
  }, []);
  async function checkIn(e: FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return setError('Enter a name.');
    try {
      await api.operations.visitors.checkIn({ ...f, kind: f.kind as Visitor['kind'] });
      setF({ name: '', kind: 'VISITOR', company: '', siteName: '' });
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    }
  }
  async function checkOut(id: string) {
    try {
      await api.operations.visitors.checkOut(id);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  const onSite = rows.filter((v) => v.status === 'ON_SITE');
  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Visitor Management</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Card className="p-5">
        <form onSubmit={checkIn} className="grid gap-3 sm:grid-cols-[1.3fr_1fr_1.3fr_1.3fr_auto] sm:items-end">
          <Field id="vName" label="Name"><Input id="vName" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field id="vKind" label="Type"><select id="vKind" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className={selectCls}>{['VISITOR', 'CONTRACTOR', 'DELIVERY', 'STAFF', 'OTHER'].map((k) => <option key={k}>{k}</option>)}</select></Field>
          <Field id="vCo" label="Company / host"><Input id="vCo" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></Field>
          <Field id="vSite" label="Site"><Input id="vSite" value={f.siteName} onChange={(e) => setF({ ...f, siteName: e.target.value })} /></Field>
          <Button type="submit">Check in</Button>
        </form>
      </Card>
      <Card className="p-4">
        <p className="mb-2 text-sm font-semibold text-[#1E293B]">On site now ({onSite.length})</p>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#94A3B8]">No check-ins yet.</p>
        ) : (
          <ul className="divide-y divide-[#E5E7EB]">{rows.slice(0, 30).map((v) => (
            <li key={v.id} className="flex items-center gap-3 py-3 text-sm">
              <span className={cn('grid h-9 w-9 place-items-center rounded-lg', v.status === 'ON_SITE' ? 'bg-[#DCFCE7]' : 'bg-[#F1F5F9]')}><Icon name="idCard" size={16} /></span>
              <div className="min-w-0 flex-1"><p className="font-medium text-[#1E293B]">{v.name} <span className="text-xs text-[#94A3B8]">{v.kind}</span></p><p className="truncate text-xs text-[#64748B]">{[v.company, v.siteName].filter(Boolean).join(' · ')} · in {new Date(v.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
              {v.status === 'ON_SITE' ? <Button size="sm" variant="ghost" onClick={() => checkOut(v.id)}>Check out</Button> : <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-xs text-[#64748B]">Left</span>}
            </li>
          ))}</ul>
        )}
      </Card>
    </div>
  );
}
