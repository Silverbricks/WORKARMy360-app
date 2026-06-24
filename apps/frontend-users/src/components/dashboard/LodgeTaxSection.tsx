'use client';

import { type FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import type { TaxLodgement, TaxLodgementKind, WorkReadiness } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

const FYS = ['2025-26', '2024-25', '2023-24'];
const selectCls =
  'h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]';

export function LodgeTaxSection() {
  const [w, setW] = useState<WorkReadiness | null>(null);
  const [items, setItems] = useState<TaxLodgement[]>([]);
  const [kind, setKind] = useState<TaxLodgementKind>('personal');
  const [fy, setFy] = useState(FYS[0]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([api.workReadiness.get(), api.workReadiness.listLodgements()])
      .then(([wr, ls]) => {
        if (!active) return;
        setW(wr);
        setItems(ls);
      })
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);
    setBusy(true);
    try {
      const created = await api.workReadiness.addLodgement({ kind, financialYear: fy, note: note.trim() || undefined });
      setItems((prev) => [created, ...prev]);
      setNote('');
      setSent(true);
    } catch (e2) {
      setError(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  const tfnOk = (w?.tfn ?? '').length >= 8;
  const abnOk = /^\d{11}$/.test(w?.abn ?? '');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Lodge Tax Return</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">
          Prepare and lodge your tax return — or get help from a registered agent.
        </p>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {sent ? <Alert tone="success">Lodgement requested — our team will be in touch.</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <KindCard
          active={kind === 'personal'}
          onClick={() => setKind('personal')}
          emoji="👤"
          title="Personal tax return"
          desc="Individual / TFN — wages, super & work deductions."
          ok={tfnOk}
          okLabel={tfnOk ? 'TFN on file' : 'Add TFN first'}
        />
        <KindCard
          active={kind === 'abn'}
          onClick={() => setKind('abn')}
          emoji="🧾"
          title="Business / ABN tax"
          desc="Sole trader / contractor — income & GST (BAS)."
          ok={abnOk}
          okLabel={abnOk ? 'ABN on file' : 'Add ABN first'}
        />
      </div>

      <Card className="p-5">
        <form onSubmit={onSubmit} className="space-y-3">
          <Field id="fy" label="Financial year">
            <select id="fy" className={selectCls} value={fy} onChange={(e) => setFy(e.target.value)}>
              {FYS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>
          <Field id="note" label="Notes for our tax team (optional)">
            <textarea
              id="note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything we should know…"
              className="w-full rounded-lg border border-[#E5E7EB] bg-white p-3 text-sm text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]"
            />
          </Field>
          <Button type="submit" loading={busy}>
            Request lodgement
          </Button>
        </form>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 20 }}>💬</span>
          <div>
            <p className="font-medium text-[#1E293B]">Need help with your tax?</p>
            <p className="text-sm text-[#64748B]">Talk to our team or a registered tax agent.</p>
          </div>
        </div>
        <Link href="/dashboard/support?tab=help">
          <Button variant="secondary">Contact us</Button>
        </Link>
      </Card>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-3">
          <h2 className="text-sm font-semibold text-[#1E293B]">Lodgement history</h2>
          <Link href="/dashboard/my-tax" className="text-sm" style={{ color: 'var(--accent)' }}>
            My Tax details
          </Link>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[#94A3B8]">No tax returns lodged yet.</p>
        ) : (
          <ul className="divide-y divide-[#F1F5F9]">
            {items.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                <span style={{ fontSize: 18 }}>{l.kind === 'abn' ? '🧾' : '👤'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1E293B]">
                    {l.kind === 'abn' ? 'Business / ABN' : 'Personal'} · FY {l.financialYear}
                  </p>
                  <p className="text-xs text-[#64748B]">{new Date(l.createdAt).toLocaleDateString('en-AU')}</p>
                </div>
                <span className="rounded-full bg-[#FEF9C3] px-2.5 py-0.5 text-xs font-medium text-[#854D0E]">
                  {l.status.replace('_', ' ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="px-1 text-xs text-[#94A3B8]">
        WorkArmy helps gather your income data and connects you with a registered tax agent. Formal advice
        and lodgement are provided by registered agents or via your own myGov/ATO account.
      </p>
    </div>
  );
}

function KindCard({
  active,
  onClick,
  emoji,
  title,
  desc,
  ok,
  okLabel,
}: {
  active: boolean;
  onClick: () => void;
  emoji: string;
  title: string;
  desc: string;
  ok: boolean;
  okLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('rounded-2xl border bg-white p-5 text-left transition', active ? 'ring-2' : 'border-[#E5E7EB] hover:bg-[#F8FAFC]')}
      style={active ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent)' } : undefined}
    >
      <div className="mb-2 text-2xl">{emoji}</div>
      <p className="font-semibold text-[#1E293B]">{title}</p>
      <p className="mt-1 text-sm text-[#64748B]">{desc}</p>
      <span
        className="mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
        style={{ backgroundColor: ok ? '#DCFCE7' : '#FEF9C3', color: ok ? '#166534' : '#854D0E' }}
      >
        {ok ? `✓ ${okLabel}` : okLabel}
      </span>
    </button>
  );
}
