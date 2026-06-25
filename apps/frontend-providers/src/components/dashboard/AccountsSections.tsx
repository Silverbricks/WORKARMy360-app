'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { BusinessDoc, BusinessDocType, PayRun, PieceRate } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

const money = (c: number) => '$' + (c / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const selectCls =
  'h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]';

// ---- Pay Runs ----
export function PayRunsSection() {
  const [rows, setRows] = useState<PayRun[]>([]);
  const [f, setF] = useState({ periodStart: '', periodEnd: '' });
  const [error, setError] = useState<string | null>(null);
  const load = () => api.accounts.payRuns.list().then(setRows).catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    void load();
  }, []);
  async function build(e: FormEvent) {
    e.preventDefault();
    if (!f.periodStart || !f.periodEnd) return setError('Pick a period.');
    try {
      await api.accounts.payRuns.build(f);
      setF({ periodStart: '', periodEnd: '' });
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    }
  }
  async function setStatus(id: string, status: PayRun['status']) {
    try { await api.accounts.payRuns.setStatus(id, { status }); await load(); } catch (e) { setError(errorMessage(e)); }
  }
  const tone: Record<string, string> = { DRAFT: 'bg-[#F1F5F9] text-[#64748B]', FINALISED: 'bg-[#DBEAFE] text-[#1E40AF]', PAID: 'bg-[#DCFCE7] text-[#166534]' };
  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Pay Runs</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Card className="p-5">
        <p className="mb-3 text-sm text-[#64748B]">Build a pay run from issued payslips. Super &amp; PAYG are summed automatically.</p>
        <form onSubmit={build} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field id="pStart" label="Period start"><Input id="pStart" type="date" value={f.periodStart} onChange={(e) => setF({ ...f, periodStart: e.target.value })} /></Field>
          <Field id="pEnd" label="Period end"><Input id="pEnd" type="date" value={f.periodEnd} onChange={(e) => setF({ ...f, periodEnd: e.target.value })} /></Field>
          <Button type="submit">Build pay run</Button>
        </form>
      </Card>
      {rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#94A3B8]">No pay runs yet.</Card>
      ) : (
        <div className="space-y-3">{rows.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-[#1E293B]">{r.periodStart} → {r.periodEnd}</p>
                <p className="text-xs text-[#64748B]">{r.workers} workers · gross ${r.grossPay.toLocaleString()} · PAYG ${r.payg.toLocaleString()} · super ${r.superAmount.toLocaleString()} · net ${r.netPay.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone[r.status]}`}>{r.status}</span>
                {r.status === 'DRAFT' ? <Button size="sm" variant="secondary" onClick={() => setStatus(r.id, 'FINALISED')}>Export ABA</Button> : null}
                {r.status !== 'PAID' ? <Button size="sm" onClick={() => setStatus(r.id, 'PAID')}>Approve &amp; pay</Button> : null}
              </div>
            </div>
          </Card>
        ))}</div>
      )}
    </div>
  );
}

// ---- Business docs (invoices / quotes / proposals) ----
type LineRow = { description: string; qty: number; rate: number };
export function BusinessDocsSection() {
  const [rows, setRows] = useState<BusinessDoc[]>([]);
  const [type, setType] = useState<BusinessDocType>('INVOICE');
  const [client, setClient] = useState('');
  const [gst, setGst] = useState(true);
  const [lines, setLines] = useState<LineRow[]>([{ description: '', qty: 1, rate: 0 }]);
  const [error, setError] = useState<string | null>(null);
  const load = () => api.accounts.docs.list().then(setRows).catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    void load();
  }, []);

  const subtotal = lines.reduce((n, l) => n + (Number(l.qty) || 0) * (Number(l.rate) || 0), 0);
  const gstAmt = gst ? subtotal * 0.1 : 0;

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!client.trim()) return setError('Enter a client.');
    const valid = lines.filter((l) => l.description.trim());
    if (valid.length === 0) return setError('Add at least one line.');
    try {
      await api.accounts.docs.create({ type, clientName: client, gst, lines: valid });
      setClient('');
      setLines([{ description: '', qty: 1, rate: 0 }]);
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    }
  }
  async function remove(id: string) {
    try { await api.accounts.docs.remove(id); await load(); } catch (e) { setError(errorMessage(e)); }
  }
  async function markPaid(id: string) {
    try { await api.accounts.docs.setStatus(id, { status: 'PAID' }); await load(); } catch (e) { setError(errorMessage(e)); }
  }
  const tone: Record<string, string> = { DRAFT: 'bg-[#F1F5F9] text-[#64748B]', SENT: 'bg-[#FEF3C7] text-[#92400E]', ACCEPTED: 'bg-[#DBEAFE] text-[#1E40AF]', PAID: 'bg-[#DCFCE7] text-[#166534]', DECLINED: 'bg-[#FEE2E2] text-[#991B1B]', VOID: 'bg-[#F1F5F9] text-[#64748B]' };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Invoices, Quotes &amp; Proposals</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Card className="p-5">
        <form onSubmit={create} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
            <Field id="dType" label="Type"><select id="dType" value={type} onChange={(e) => setType(e.target.value as BusinessDocType)} className={selectCls}>{(['INVOICE', 'QUOTE', 'PROPOSAL'] as BusinessDocType[]).map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field id="dClient" label="Client / for"><Input id="dClient" value={client} onChange={(e) => setClient(e.target.value)} /></Field>
            <label className="flex items-center gap-2 pb-2.5 text-sm"><input type="checkbox" checked={gst} onChange={(e) => setGst(e.target.checked)} /> GST 10%</label>
          </div>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[2fr_0.6fr_0.8fr_auto] gap-2">
                <Input value={l.description} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} placeholder="Description" />
                <Input type="number" value={String(l.qty)} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)))} placeholder="Qty" />
                <Input type="number" value={String(l.rate)} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, rate: Number(e.target.value) } : x)))} placeholder="Rate $" />
                <button type="button" onClick={() => setLines(lines.length > 1 ? lines.filter((_, j) => j !== i) : lines)} className="text-[#94A3B8] hover:text-[#991B1B]" aria-label="Remove line"><Icon name="trash" size={16} /></button>
              </div>
            ))}
            <Button type="button" size="sm" variant="ghost" onClick={() => setLines([...lines, { description: '', qty: 1, rate: 0 }])}>+ Add line</Button>
          </div>
          <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-3 text-sm">
            <span className="text-[#64748B]">Subtotal ${subtotal.toFixed(2)}{gst ? ` · GST $${gstAmt.toFixed(2)}` : ''}</span>
            <span className="text-lg font-semibold text-[#1E293B]">${(subtotal + gstAmt).toFixed(2)}</span>
          </div>
          <Button type="submit">Save {type.toLowerCase()}</Button>
        </form>
      </Card>
      {rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#94A3B8]">No documents yet.</Card>
      ) : (
        <Card className="p-4"><ul className="divide-y divide-[#E5E7EB]">{rows.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F1F5F9]"><Icon name="receipt" size={16} /></span>
            <div className="min-w-0 flex-1"><p className="font-medium text-[#1E293B]">{d.number} — {d.clientName} <span className="text-xs text-[#94A3B8]">· {d.type}</span></p><p className="text-xs text-[#64748B]">{d.date} · {money(d.totalCents)}{d.gst ? ' incl GST' : ''}</p></div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone[d.status]}`}>{d.status}</span>
            {d.status !== 'PAID' && d.type === 'INVOICE' ? <Button size="sm" variant="ghost" onClick={() => markPaid(d.id)}>Mark paid</Button> : null}
            <button type="button" onClick={() => remove(d.id)} className="text-[#94A3B8] hover:text-[#991B1B]" aria-label="Remove"><Icon name="trash" size={16} /></button>
          </li>
        ))}</ul></Card>
      )}
    </div>
  );
}

// ---- Piece rates ----
export function PieceRatesSection() {
  const [rows, setRows] = useState<PieceRate[]>([]);
  const [f, setF] = useState({ name: '', unitLabel: '', rate: '', minWage: '' });
  const [error, setError] = useState<string | null>(null);
  const load = () => api.accounts.pieceRates.list().then(setRows).catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    void load();
  }, []);
  async function add(e: FormEvent) {
    e.preventDefault();
    if (!f.name.trim() || !f.unitLabel.trim()) return setError('Name and unit required.');
    try {
      await api.accounts.pieceRates.create({ name: f.name, unitLabel: f.unitLabel, rate: Number(f.rate) || 0, minWage: f.minWage ? Number(f.minWage) : undefined });
      setF({ name: '', unitLabel: '', rate: '', minWage: '' });
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    }
  }
  async function remove(id: string) {
    try { await api.accounts.pieceRates.remove(id); await load(); } catch (e) { setError(errorMessage(e)); }
  }
  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Piece Rates</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Card className="p-5">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_auto] sm:items-end">
          <Field id="prName" label="Task"><Input id="prName" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Apple picking" /></Field>
          <Field id="prUnit" label="Unit"><Input id="prUnit" value={f.unitLabel} onChange={(e) => setF({ ...f, unitLabel: e.target.value })} placeholder="per bin" /></Field>
          <Field id="prRate" label="Rate $"><Input id="prRate" type="number" value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} /></Field>
          <Field id="prMin" label="Floor $/hr"><Input id="prMin" type="number" value={f.minWage} onChange={(e) => setF({ ...f, minWage: e.target.value })} /></Field>
          <Button type="submit">+ Add</Button>
        </form>
      </Card>
      {rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#94A3B8]">No piece rates yet.</Card>
      ) : (
        <Card className="p-4"><ul className="divide-y divide-[#E5E7EB]">{rows.map((p) => {
          const ok = p.minWageCents == null || p.rateCents >= p.minWageCents;
          return (
            <li key={p.id} className="flex items-center gap-3 py-3 text-sm">
              <div className="min-w-0 flex-1"><p className="font-medium text-[#1E293B]">{p.name}</p><p className="text-xs text-[#64748B]">{money(p.rateCents)} {p.unitLabel}</p></div>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', ok ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEF3C7] text-[#92400E]')}>{ok ? '✓ above floor' : 'review'}</span>
              <button type="button" onClick={() => remove(p.id)} className="text-[#94A3B8] hover:text-[#991B1B]" aria-label="Remove"><Icon name="trash" size={16} /></button>
            </li>
          );
        })}</ul>
        <p className="mt-2 text-xs text-[#94A3B8]">Piece rates must let an average competent worker earn at least the award hourly minimum.</p>
        </Card>
      )}
    </div>
  );
}
