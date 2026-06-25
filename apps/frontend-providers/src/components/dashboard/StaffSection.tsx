'use client';

import { type FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { OrgWorker } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

type Tab = 'directory' | 'oncall';

export function StaffSection() {
  const tabParam = (useSearchParams().get('tab') as Tab) || 'directory';
  const tab: Tab = tabParam === 'oncall' ? 'oncall' : 'directory';

  const [workers, setWorkers] = useState<OrgWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ waId: '', staffType: '', onCall: false, urgentAvailable: false });
  const [busy, setBusy] = useState(false);

  async function load() {
    setWorkers(await api.staff.workers.list());
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.staff.workers.list();
        if (active) setWorkers(data);
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

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!form.waId.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.staff.workers.add(form);
      setForm({ waId: '', staffType: '', onCall: false, urgentAvailable: false });
      setShowAdd(false);
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(w: OrgWorker, key: 'onCall' | 'urgentAvailable') {
    setError(null);
    try {
      await api.staff.workers.update(w.id, { [key]: !w[key] });
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await api.staff.workers.remove(id);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const list = tab === 'oncall' ? workers.filter((w) => w.onCall || w.urgentAvailable) : workers;

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl">Staff</h1>
        <Button onClick={() => setShowAdd((s) => !s)}>{showAdd ? 'Cancel' : '+ Add staff'}</Button>
      </div>

      <div className="flex gap-1 border-b border-[#E5E7EB]">
        {(['directory', 'oncall'] as const).map((t) => (
          <Link
            key={t}
            href={`/dashboard/staff?tab=${t}`}
            className={cn('border-b-2 px-4 py-2 text-sm font-medium', tab === t ? '' : 'border-transparent text-[#94A3B8]')}
            style={tab === t ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}
          >
            {t === 'directory' ? 'Staff Directory' : 'On-Call & Urgent'}
          </Link>
        ))}
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      {showAdd ? (
        <Card className="p-5">
          <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
            <Field id="waId" label="Worker WorkArmy ID">
              <Input id="waId" value={form.waId} onChange={(e) => setForm({ ...form, waId: e.target.value })} placeholder="WA100123" />
            </Field>
            <Field id="staffType" label="Staff type">
              <Input id="staffType" value={form.staffType} onChange={(e) => setForm({ ...form, staffType: e.target.value })} placeholder="Fruit Picker / Driver…" />
            </Field>
            <div className="flex items-center gap-4 sm:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.onCall} onChange={(e) => setForm({ ...form, onCall: e.target.checked })} /> On-call
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.urgentAvailable} onChange={(e) => setForm({ ...form, urgentAvailable: e.target.checked })} /> Urgent-available
              </label>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" loading={busy}>Add staff</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {list.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#94A3B8]">
          {tab === 'oncall' ? 'No on-call or urgent staff yet.' : 'No staff added yet. Add by WorkArmy ID, or invite from'}{' '}
          {tab === 'directory' ? <Link href="/dashboard/find-staff" style={{ color: 'var(--accent)' }}>Find Job Seekers</Link> : null}.
        </Card>
      ) : (
        <Card className="p-4">
          <ul className="divide-y divide-[#E5E7EB]">
            {list.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="grid h-9 w-9 place-items-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: 'var(--accent)' }}>
                  {w.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1E293B]">
                    {w.name} <span className="font-mono text-xs text-[#94A3B8]">{w.waId}</span>
                  </p>
                  <p className="truncate text-xs text-[#64748B]">{w.staffType || '—'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(w, 'onCall')}
                  className={cn('rounded-full px-2.5 py-1 text-xs font-medium', w.onCall ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#F1F5F9] text-[#64748B]')}
                >
                  On-call
                </button>
                <button
                  type="button"
                  onClick={() => toggle(w, 'urgentAvailable')}
                  className={cn('rounded-full px-2.5 py-1 text-xs font-medium', w.urgentAvailable ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#F1F5F9] text-[#64748B]')}
                >
                  Urgent
                </button>
                <button type="button" onClick={() => remove(w.id)} className="text-[#94A3B8] hover:text-[#991B1B]" aria-label="Remove">
                  <Icon name="trash" size={16} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
