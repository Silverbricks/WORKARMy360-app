'use client';

import { useEffect, useState } from 'react';
import type { WorkerDirectoryItem } from '@workarmy/types';
import { Alert, Button, Card, Icon, Input } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

export function FindStaffSection() {
  const [q, setQ] = useState('');
  const [state, setState] = useState('');
  const [workType, setWorkType] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [rows, setRows] = useState<WorkerDirectoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      setRows(await api.staff.directory.browse({ q, state, workType, urgent }));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function invite(waId: string) {
    setInfo(null);
    try {
      await api.staff.directory.invite(waId, {});
      setInfo(`Invite sent to ${waId}.`);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const selectCls =
    'h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl">Find Job Seekers</h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Browse available workers who&apos;ve published their card, and invite them to your roles.
        </p>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {info ? <Alert tone="success">{info}</Alert> : null}

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#64748B]">Search</label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Role, skill or qualification…" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#64748B]">State</label>
            <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="VIC / NSW" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#64748B]">Work type</label>
            <select value={workType} onChange={(e) => setWorkType(e.target.value)} className={`w-full ${selectCls}`}>
              <option value="">Any</option>
              <option value="hourly">Hourly</option>
              <option value="weekly">Weekly</option>
              <option value="contract">Contract</option>
              <option value="any">Flexible</option>
            </select>
          </div>
          <Button onClick={load}>Search</Button>
        </div>
        <label className="mt-3 inline-flex items-center gap-2 text-sm text-[#475569]">
          <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} /> Available for urgent
          shifts
        </label>
      </Card>

      {rows === null ? (
        <div className="py-10 text-center text-sm text-[#64748B]">Loading workers…</div>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#94A3B8]">No workers match your filters yet.</Card>
      ) : (
        <Card className="p-4">
          <p className="mb-2 text-sm font-semibold text-[#1E293B]">{rows.length} available workers</p>
          <ul className="divide-y divide-[#E5E7EB]">
            {rows.map((w) => (
              <li key={w.waId} className="flex flex-wrap items-center gap-3 py-3">
                <span
                  className="grid h-10 w-10 place-items-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {w.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-[#1E293B]">
                    {w.name}
                    {w.urgentShifts ? (
                      <span className="rounded-full bg-[#FEF3C7] px-1.5 py-0.5 text-[10px] font-semibold text-[#92400E]">
                        Urgent OK
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-[#64748B]">
                    {[w.headline || w.qualification, [w.suburb, w.state].filter(Boolean).join(', '), w.workType, w.skills]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </div>
                <Button size="sm" onClick={() => invite(w.waId)}>
                  <Icon name="send" size={14} /> Invite
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
