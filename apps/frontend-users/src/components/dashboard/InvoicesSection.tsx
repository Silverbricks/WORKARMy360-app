'use client';

import { type FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Invoice, InvoiceLineKind } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input, formatCurrencyAUD } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

interface DraftLine {
  kind: InvoiceLineKind;
  description: string;
  qty: string;
  rate: string; // dollars
}

const emptyLine = (): DraftLine => ({ kind: 'hourly', description: '', qty: '1', rate: '' });
const today = () => new Date().toISOString().slice(0, 10);
const money = (cents: number) => formatCurrencyAUD(cents / 100);

export function InvoicesSection() {
  const [abn, setAbn] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ clientName: '', clientAbn: '', date: today(), notes: '', gst: true });
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);

  useEffect(() => {
    let active = true;
    Promise.all([api.workReadiness.get(), api.invoices.list()])
      .then(([wr, list]) => {
        if (!active) return;
        setAbn(wr.abn);
        setInvoices(list);
      })
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const hasAbn = /^\d{11}$/.test(abn ?? '');
  const subtotalCents = lines.reduce(
    (s, l) => s + Math.round((Number(l.qty) || 0)) * Math.round((Number(l.rate) || 0) * 100),
    0,
  );
  const gstCents = form.gst ? Math.round(subtotalCents * 0.1) : 0;
  const totalCents = subtotalCents + gstCents;

  function setLine(i: number, patch: Partial<DraftLine>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const lineItems = lines
      .filter((l) => l.description.trim() && Number(l.qty) > 0)
      .map((l) => ({
        kind: l.kind,
        description: l.description.trim(),
        qty: Math.round(Number(l.qty)),
        rateCents: Math.round(Number(l.rate) * 100),
      }));
    if (!form.clientName.trim() || lineItems.length === 0) {
      setError('Enter a client and at least one line item.');
      return;
    }
    setBusy(true);
    try {
      const created = await api.invoices.create({
        clientName: form.clientName.trim(),
        clientAbn: form.clientAbn.trim() || undefined,
        date: form.date,
        gst: form.gst,
        notes: form.notes.trim() || undefined,
        lineItems,
      });
      setInvoices((prev) => [created, ...prev]);
      setForm({ clientName: '', clientAbn: '', date: today(), notes: '', gst: true });
      setLines([emptyLine()]);
    } catch (e2) {
      setError(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  }

  async function markPaid(id: string) {
    try {
      const updated = await api.invoices.markPaid(id);
      setInvoices((prev) => prev.map((iv) => (iv.id === id ? updated : iv)));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function remove(id: string) {
    setInvoices((prev) => prev.filter((iv) => iv.id !== id));
    try {
      await api.invoices.remove(id);
    } catch {
      // best-effort
    }
  }

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  if (!hasAbn) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl">Invoices</h1>
          <p className="mt-0.5 text-sm text-[#64748B]">Bill clients for contract work.</p>
        </div>
        <Card className="p-8 text-center" style={{ borderColor: '#EAD3A1', backgroundColor: '#FBF1DD' }}>
          <div className="mb-2 text-4xl">🧾</div>
          <p className="font-semibold text-[#854D0E]">Add your ABN to start invoicing</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-[#854D0E]">
            Invoicing is for contract work, which requires a valid 11-digit ABN.
          </p>
          <div className="mt-4">
            <Link href="/dashboard/work-readiness">
              <Button>Add ABN in Work Readiness →</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const totalBilled = invoices.reduce((s, i) => s + i.totalCents, 0);
  const outstanding = invoices.filter((i) => i.status !== 'Paid').reduce((s, i) => s + i.totalCents, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Invoices</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">Create and send invoices for your contract work.</p>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Invoices" value={String(invoices.length)} />
        <Stat label="Total billed" value={money(totalBilled)} />
        <Stat label="Outstanding" value={money(outstanding)} />
      </div>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#1E293B]">New invoice</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="client" label="Bill to (client / business)">
              <Input id="client" value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} placeholder="e.g. Green Valley Orchards" />
            </Field>
            <Field id="clientAbn" label="Client ABN (optional)">
              <Input id="clientAbn" value={form.clientAbn} onChange={(e) => setForm((f) => ({ ...f, clientAbn: e.target.value }))} placeholder="11-digit ABN" />
            </Field>
            <Field id="date" label="Date">
              <Input id="date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </Field>
          </div>

          <p className="text-sm font-medium text-[#1E293B]">Line items</p>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_110px_80px_110px_auto] sm:items-center">
                <Input
                  value={l.description}
                  onChange={(e) => setLine(i, { description: e.target.value })}
                  placeholder={l.kind === 'piece' ? 'e.g. Bins picked' : 'e.g. Fruit picking — wk 24'}
                />
                <select
                  className="h-11 rounded-lg border border-[#E5E7EB] bg-white px-2 text-sm"
                  value={l.kind}
                  onChange={(e) => setLine(i, { kind: e.target.value as InvoiceLineKind })}
                >
                  <option value="hourly">Hourly</option>
                  <option value="piece">Piece</option>
                </select>
                <Input type="number" min="0" step="0.5" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} placeholder="Qty" />
                <Input type="number" min="0" step="0.5" value={l.rate} onChange={(e) => setLine(i, { rate: e.target.value })} placeholder="$ rate" />
                {lines.length > 1 ? (
                  <button type="button" onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))} className="text-[#94A3B8] hover:text-[#DC2626]" aria-label="Remove line">
                    <Icon name="trash" size={16} />
                  </button>
                ) : (
                  <span />
                )}
              </div>
            ))}
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => setLines((ls) => [...ls, emptyLine()])}>
            <Icon name="plus" size={14} /> Add line
          </Button>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] pt-3">
            <label className="flex items-center gap-2 text-sm text-[#1E293B]">
              <input type="checkbox" checked={form.gst} onChange={(e) => setForm((f) => ({ ...f, gst: e.target.checked }))} style={{ accentColor: 'var(--accent)' }} />
              Add GST (10%)
            </label>
            <div className="text-right text-sm text-[#64748B]">
              <div>Subtotal: <span className="font-semibold text-[#1E293B]">{money(subtotalCents)}</span></div>
              {form.gst ? <div>GST: <span className="font-semibold text-[#1E293B]">{money(gstCents)}</span></div> : null}
              <div className="text-lg font-semibold text-[#1E293B]">Total: {money(totalCents)}</div>
            </div>
          </div>

          <Field id="notes" label="Notes / payment terms">
            <Input id="notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="e.g. Payment within 7 days" />
          </Field>

          <Button type="submit" loading={busy}>
            Save &amp; send invoice
          </Button>
        </form>
      </Card>

      <Card className="p-0">
        <div className="border-b border-[#E5E7EB] px-5 py-3">
          <h2 className="text-sm font-semibold text-[#1E293B]">My invoices</h2>
        </div>
        {invoices.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[#94A3B8]">No invoices yet.</p>
        ) : (
          <ul className="divide-y divide-[#F1F5F9]">
            {invoices.map((iv) => (
              <li key={iv.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#1E293B]">
                    {iv.number} — {iv.clientName}
                  </p>
                  <p className="text-xs text-[#64748B]">
                    {new Date(iv.date).toLocaleDateString('en-AU')} · {money(iv.totalCents)}
                    {iv.gst ? ' (incl GST)' : ''}
                  </p>
                </div>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: iv.status === 'Paid' ? '#DCFCE7' : '#FEF9C3',
                    color: iv.status === 'Paid' ? '#166534' : '#854D0E',
                  }}
                >
                  {iv.status}
                </span>
                {iv.status !== 'Paid' ? (
                  <Button size="sm" variant="secondary" onClick={() => markPaid(iv.id)}>
                    Mark paid
                  </Button>
                ) : null}
                <button type="button" onClick={() => remove(iv.id)} className="text-[#94A3B8] hover:text-[#DC2626]" aria-label="Delete invoice">
                  <Icon name="trash" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-[#64748B]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#1E293B]">{value}</p>
    </Card>
  );
}
