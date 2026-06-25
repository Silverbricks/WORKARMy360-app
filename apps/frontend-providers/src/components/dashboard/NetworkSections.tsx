'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type {
  ProviderDirectoryOrg,
  ProviderEngagement,
  QuoteRequest,
  ReportSummary,
} from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

const selectCls =
  'h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]';

export function NetworkSection() {
  const [engagements, setEngagements] = useState<ProviderEngagement[]>([]);
  const [directory, setDirectory] = useState<ProviderDirectoryOrg[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ providerName: '', kind: 'Provider', category: '', location: '' });
  const [quoteFor, setQuoteFor] = useState<string | null>(null);
  const [quoteScope, setQuoteScope] = useState('');

  async function load() {
    const [e, d, q] = await Promise.all([
      api.network.engagements.list(),
      api.network.directory().catch(() => [] as ProviderDirectoryOrg[]),
      api.network.quotes.list(),
    ]);
    setEngagements(e);
    setDirectory(d);
    setQuotes(q);
  }
  useEffect(() => {
    load().catch((e) => setError(errorMessage(e)));
  }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!f.providerName.trim()) return setError('Enter a name.');
    try {
      await api.network.engagements.create(f);
      setF({ providerName: '', kind: 'Provider', category: '', location: '' });
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    }
  }
  async function engageOrg(o: ProviderDirectoryOrg) {
    try {
      await api.network.engagements.create({ providerName: o.name, kind: o.accountType.replace(/_/g, ' '), category: o.industry ?? undefined, location: o.region ?? undefined });
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function toggle(id: string) {
    try { await api.network.engagements.toggle(id); await load(); } catch (e) { setError(errorMessage(e)); }
  }
  async function remove(id: string) {
    try { await api.network.engagements.remove(id); await load(); } catch (e) { setError(errorMessage(e)); }
  }
  async function sendQuote(toLabel: string) {
    if (!quoteScope.trim()) return setError('Enter a scope.');
    try {
      await api.network.quotes.create({ toLabel, scope: quoteScope });
      setQuoteScope('');
      setQuoteFor(null);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Service Providers &amp; Agencies</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold text-[#1E293B]">Add a provider / contractor / agency</p>
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1.5fr_1fr_1.2fr_1fr_auto] sm:items-end">
          <Field id="pN" label="Name"><Input id="pN" value={f.providerName} onChange={(e) => setF({ ...f, providerName: e.target.value })} /></Field>
          <Field id="pK" label="Type"><select id="pK" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className={selectCls}>{['Provider', 'Contractor', 'Agency'].map((k) => <option key={k}>{k}</option>)}</select></Field>
          <Field id="pC" label="Category"><Input id="pC" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="Cleaning, Drivers…" /></Field>
          <Field id="pL" label="Location"><Input id="pL" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></Field>
          <Button type="submit">+ Add</Button>
        </form>
      </Card>

      <Card className="p-4">
        <p className="mb-2 text-sm font-semibold text-[#1E293B]">Connected providers ({engagements.length})</p>
        {engagements.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#94A3B8]">No providers engaged yet.</p>
        ) : (
          <ul className="divide-y divide-[#E5E7EB]">
            {engagements.map((p) => (
              <li key={p.id} className="py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F1F5F9]"><Icon name="building" size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#1E293B]">{p.providerName} {p.kind ? <span className="text-xs text-[#94A3B8]">· {p.kind}</span> : null}</p>
                    <p className="truncate text-xs text-[#64748B]">{[p.category, p.location].filter(Boolean).join(' · ') || '—'}</p>
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', p.status === 'ENGAGED' ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#F1F5F9] text-[#64748B]')}>{p.status}</span>
                  <Button size="sm" variant="ghost" onClick={() => setQuoteFor(quoteFor === p.id ? null : p.id)}>Get quote</Button>
                  <Button size="sm" variant="ghost" onClick={() => toggle(p.id)}>{p.status === 'ENGAGED' ? 'End' : 'Re-engage'}</Button>
                  <button type="button" onClick={() => remove(p.id)} className="text-[#94A3B8] hover:text-[#991B1B]" aria-label="Remove"><Icon name="trash" size={16} /></button>
                </div>
                {quoteFor === p.id ? (
                  <div className="mt-2 flex items-end gap-2">
                    <Input value={quoteScope} onChange={(e) => setQuoteScope(e.target.value)} placeholder="Scope of work — e.g. 8 pickers for 2 weeks" />
                    <Button size="sm" onClick={() => sendQuote(p.providerName)}>Send</Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {directory.length > 0 ? (
        <Card className="p-4">
          <p className="mb-2 text-sm font-semibold text-[#1E293B]">Discover on WorkArmy</p>
          <ul className="divide-y divide-[#E5E7EB]">
            {directory.slice(0, 20).map((o) => (
              <li key={o.waId} className="flex items-center gap-3 py-3 text-sm">
                <div className="min-w-0 flex-1"><p className="font-medium text-[#1E293B]">{o.name} <span className="text-xs text-[#94A3B8]">· {o.accountType.replace(/_/g, ' ')}</span></p><p className="truncate text-xs text-[#64748B]">{[o.industry, o.region].filter(Boolean).join(' · ') || '—'}</p></div>
                <Button size="sm" onClick={() => engageOrg(o)}>Engage</Button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="p-4">
        <p className="mb-2 text-sm font-semibold text-[#1E293B]">Quote requests ({quotes.length})</p>
        {quotes.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#94A3B8]">No quote requests yet.</p>
        ) : (
          <ul className="divide-y divide-[#E5E7EB]">
            {quotes.map((q) => (
              <li key={q.id} className="flex items-center gap-3 py-3 text-sm">
                <div className="min-w-0 flex-1"><p className="font-medium text-[#1E293B]">{q.toLabel} — {q.scope}</p><p className="text-xs text-[#64748B]">{new Date(q.createdAt).toLocaleDateString()}</p></div>
                <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-xs font-medium text-[#92400E]">{q.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsSection() {
  const [r, setR] = useState<ReportSummary | null>(null);
  useEffect(() => {
    api.network.reports().then(setR).catch(() => {});
  }, []);
  const stats: { label: string; value: string }[] = [
    { label: 'Payroll (total)', value: `$${(r?.payrollTotal ?? 0).toLocaleString()}` },
    { label: 'Hours (total)', value: String(r?.hoursTotal ?? 0) },
    { label: 'Fill rate', value: `${r?.fillRatePct ?? 0}%` },
    { label: 'Worker rating', value: `${r?.workerRating ?? 0}★` },
    { label: 'Open roles', value: String(r?.openRoles ?? 0) },
    { label: 'Active workers', value: String(r?.activeWorkers ?? 0) },
  ];
  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Reports</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-2xl font-semibold text-[#1E293B]">{s.value}</p>
            <p className="mt-1 text-xs text-[#64748B]">{s.label}</p>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold text-[#1E293B]">Export</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => downloadCsv('workarmy-summary.csv', [['Metric', 'Value'], ...stats.map((s) => [s.label, s.value])])}>
            <Icon name="download" size={14} /> Summary CSV
          </Button>
        </div>
      </Card>
    </div>
  );
}
