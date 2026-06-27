'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { OrgAdmin } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { useMe } from './DashboardShell';

const selectCls =
  'h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]';

// ---- Staff Calculator (pure compute) ----
const SPLIT = [
  ['Hourly', 40],
  ['Wages', 10],
  ['Contract', 15],
  ['Piece rate', 20],
  ['Work from home', 0],
  ['Agency', 15],
] as const;

export function StaffCalculatorSection() {
  const [units, setUnits] = useState(200);
  const [hours, setHours] = useState(8);
  const [rate, setRate] = useState(4);
  const [split, setSplit] = useState<Record<string, number>>(Object.fromEntries(SPLIT.map(([k, v]) => [k, v])));

  const need = rate > 0 && hours > 0 ? Math.ceil(units / (rate * hours)) : 0;
  const sumPct = Object.values(split).reduce((a, b) => a + (Number(b) || 0), 0) || 1;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl">Staff Calculator</h1>
        <p className="mt-1 text-sm text-[#64748B]">Estimate how many staff you need from your target, shift length and productivity.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="cUnits" label="Order / target (units)"><Input id="cUnits" type="number" value={String(units)} onChange={(e) => setUnits(Number(e.target.value) || 0)} /></Field>
            <Field id="cHours" label="Shift length (hours)"><Input id="cHours" type="number" value={String(hours)} onChange={(e) => setHours(Number(e.target.value) || 0)} /></Field>
            <div className="sm:col-span-2"><Field id="cRate" label="Productivity (units per staff·hour)"><Input id="cRate" type="number" step="0.1" value={String(rate)} onChange={(e) => setRate(Number(e.target.value) || 0)} /></Field></div>
          </div>
          <div className="mt-3 rounded-lg p-5 text-center" style={{ backgroundColor: 'color-mix(in srgb, var(--accent) 6%, white)' }}>
            <p className="text-sm text-[#64748B]">You need approximately</p>
            <p className="font-display text-4xl font-semibold" style={{ color: 'var(--accent)' }}>{need} staff</p>
            <p className="text-xs text-[#64748B]">for {units} units over a {hours}h shift · {need * hours} staff-hours</p>
          </div>
        </Card>
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-[#1E293B]">Engagement split</p>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-[#94A3B8]"><th className="pb-2">Type</th><th className="pb-2">%</th><th className="pb-2">Staff</th></tr></thead>
            <tbody>
              {SPLIT.map(([k]) => {
                const pct = Number(split[k]) || 0;
                return (
                  <tr key={k} className="border-t border-[#F1F5F9]">
                    <td className="py-1.5">{k}</td>
                    <td className="py-1.5"><input type="number" value={String(pct)} onChange={(e) => setSplit({ ...split, [k]: Number(e.target.value) || 0 })} className="w-16 rounded border border-[#E5E7EB] px-2 py-1 text-right" /></td>
                    <td className="py-1.5 font-medium">{Math.round((need * pct) / sumPct)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

// ---- Team & Admins ----
export function TeamAdminsSection() {
  const me = useMe();
  const [rows, setRows] = useState<OrgAdmin[]>([]);
  const [f, setF] = useState({ waId: '', role: 'admin' });
  const [error, setError] = useState<string | null>(null);
  const load = () => api.business.admins.list().then(setRows).catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    void load();
  }, []);
  async function add(e: FormEvent) {
    e.preventDefault();
    if (!f.waId.trim()) return setError('Enter a WorkArmy ID.');
    try {
      await api.business.admins.add({ waId: f.waId, role: f.role as 'admin' | 'member' });
      setF({ waId: '', role: 'admin' });
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    }
  }
  async function remove(id: string) {
    try { await api.business.admins.remove(id); await load(); } catch (e) { setError(errorMessage(e)); }
  }
  const roleTone: Record<string, string> = { owner: 'bg-[#DCFCE7] text-[#166534]', admin: 'bg-[#DBEAFE] text-[#1E40AF]', member: 'bg-[#F1F5F9] text-[#64748B]' };
  const canManage = me.organisation.role === 'owner' || me.organisation.role === 'admin';

  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Team &amp; Admins</h1>
      <p className="text-sm text-[#64748B]">People who can manage this business account.</p>
      {error ? <Alert tone="error">{error}</Alert> : null}

      {canManage ? (
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-[#1E293B]">Add an admin by WorkArmy ID</p>
          <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1.5fr_1fr_auto] sm:items-end">
            <Field id="aWa" label="WorkArmy ID"><Input id="aWa" value={f.waId} onChange={(e) => setF({ ...f, waId: e.target.value })} placeholder="WA100123" /></Field>
            <Field id="aRole" label="Role"><select id="aRole" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} className={selectCls}>{['admin', 'member'].map((r) => <option key={r}>{r}</option>)}</select></Field>
            <Button type="submit">+ Add</Button>
          </form>
        </Card>
      ) : null}

      <Card className="p-4">
        <ul className="divide-y divide-[#E5E7EB]">
          {rows.map((m) => (
            <li key={m.memberId} className="flex items-center gap-3 py-3 text-sm">
              <span className="grid h-9 w-9 place-items-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: 'var(--accent)' }}>{m.name.slice(0, 2).toUpperCase()}</span>
              <div className="min-w-0 flex-1"><p className="font-medium text-[#1E293B]">{m.name} <span className="font-mono text-xs text-[#94A3B8]">{m.waId}</span></p></div>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', roleTone[m.role])}>{m.role}</span>
              {canManage && m.role !== 'owner' ? (
                <button type="button" onClick={() => remove(m.memberId)} className="text-[#94A3B8] hover:text-[#991B1B]" aria-label="Remove"><Icon name="trash" size={16} /></button>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
