'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { WorkLog } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ManualTimesheetSection() {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [form, setForm] = useState({ employer: '', date: today(), hours: '', note: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api.worklog
      .list()
      .then((l) => active && setLogs(l))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const hours = Number(form.hours);
    if (!form.employer.trim() || !form.date || !(hours > 0)) {
      setError('Enter an employer, date and hours.');
      return;
    }
    setBusy(true);
    try {
      const created = await api.worklog.create({
        employer: form.employer.trim(),
        date: form.date,
        hours,
        note: form.note.trim() || undefined,
      });
      setLogs((prev) => [created, ...prev]);
      setForm({ employer: '', date: today(), hours: '', note: '' });
    } catch (e2) {
      setError(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    try {
      await api.worklog.remove(id);
    } catch {
      // best-effort
    }
  }

  const totalHours = logs.reduce((n, l) => n + l.hours, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Manual Timesheet</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">
          Log hours worked for any employer — handy alongside your automatic, attendance-based
          timesheets.
        </p>
      </div>

      <Card className="p-5">
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          {error ? (
            <div className="sm:col-span-2">
              <Alert tone="error">{error}</Alert>
            </div>
          ) : null}
          <Field id="employer" label="Employer">
            <Input
              id="employer"
              value={form.employer}
              onChange={(e) => setForm((v) => ({ ...v, employer: e.target.value }))}
              placeholder="e.g. Acme Farms"
            />
          </Field>
          <Field id="date" label="Date">
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((v) => ({ ...v, date: e.target.value }))}
            />
          </Field>
          <Field id="hours" label="Hours">
            <Input
              id="hours"
              type="number"
              step="0.25"
              min="0"
              max="24"
              value={form.hours}
              onChange={(e) => setForm((v) => ({ ...v, hours: e.target.value }))}
              placeholder="e.g. 7.5"
            />
          </Field>
          <Field id="note" label="Note (optional)">
            <Input
              id="note"
              value={form.note}
              onChange={(e) => setForm((v) => ({ ...v, note: e.target.value }))}
              placeholder="Task or site"
            />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" loading={busy}>
              <Icon name="plus" size={16} /> Add entry
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-3">
          <h2 className="text-sm font-semibold text-[#1E293B]">Logged hours</h2>
          <span className="text-sm text-[#64748B]">
            Total: <span className="font-semibold text-[#1E293B]">{totalHours}</span> hrs
          </span>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-[#94A3B8]">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[#94A3B8]">No entries yet.</p>
        ) : (
          <ul className="divide-y divide-[#F1F5F9]">
            {logs.map((l) => (
              <li key={l.id} className="flex items-center gap-4 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#1E293B]">{l.employer}</p>
                  <p className="text-xs text-[#64748B]">
                    {new Date(l.date).toLocaleDateString('en-AU')}
                    {l.note ? ` · ${l.note}` : ''}
                  </p>
                </div>
                <span className="text-sm font-semibold text-[#1E293B]">{l.hours} hrs</span>
                <button
                  type="button"
                  onClick={() => remove(l.id)}
                  aria-label="Delete entry"
                  className="text-[#94A3B8] transition hover:text-[#DC2626]"
                >
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
