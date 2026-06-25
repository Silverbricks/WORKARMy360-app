'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { Dispatch, DispatchChannel } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

const CHANNELS: { key: DispatchChannel; label: string }[] = [
  { key: 'ON_CALL', label: '👷 My on-call workers' },
  { key: 'CONTRACTORS', label: '🔧 Engaged contractors' },
  { key: 'AGENCIES', label: '🤝 Labour-hire agencies' },
  { key: 'NETWORK', label: '📣 WorkArmy network' },
];

export function QuickDispatchSection() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [message, setMessage] = useState('');
  const [role, setRole] = useState('');
  const [when, setWhen] = useState('');
  const [channels, setChannels] = useState<Record<DispatchChannel, boolean>>({
    ON_CALL: true,
    CONTRACTORS: true,
    AGENCIES: true,
    NETWORK: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setDispatches(await api.staffing.dispatch.list());
  }
  useEffect(() => {
    load().catch((e) => setError(errorMessage(e)));
  }, []);

  async function send(e: FormEvent) {
    e.preventDefault();
    const picked = (Object.keys(channels) as DispatchChannel[]).filter((c) => channels[c]);
    if (!message.trim()) {
      setError('Enter a message.');
      return;
    }
    if (picked.length === 0) {
      setError('Pick at least one channel.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.staffing.dispatch.create({ message, roleNeeded: role || undefined, whenAt: when || undefined, channels: picked });
      setMessage('');
      setRole('');
      setWhen('');
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl">Quick Dispatch</h1>
        <p className="mt-1 text-sm text-[#64748B]">One tap to source urgent or bulk staff from every channel.</p>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Card className="p-5">
        <form onSubmit={send} className="space-y-3">
          <Field id="dMsg" label="What do you need?">
            <Input id="dMsg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. 4 pickers tomorrow 6am, Block 4" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="dRole" label="Role (optional)"><Input id="dRole" value={role} onChange={(e) => setRole(e.target.value)} /></Field>
            <Field id="dWhen" label="When (optional)"><Input id="dWhen" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></Field>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-[#1E293B]">Send to channels</p>
            <div className="space-y-1">
              {CHANNELS.map((c) => (
                <label key={c.key} className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
                  <span className="flex-1">{c.label}</span>
                  <input type="checkbox" checked={channels[c.key]} onChange={(e) => setChannels({ ...channels, [c.key]: e.target.checked })} />
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" loading={busy}>
            <Icon name="send" size={14} /> Dispatch now
          </Button>
        </form>
      </Card>

      <Card className="p-4">
        <p className="mb-2 text-sm font-semibold text-[#1E293B]">Dispatch log</p>
        {dispatches.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#94A3B8]">No dispatches yet.</p>
        ) : (
          <ul className="divide-y divide-[#E5E7EB]">
            {dispatches.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F1F5F9]">
                  <Icon name="send" size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#1E293B]">{d.message}</p>
                  <p className="truncate text-xs text-[#64748B]">
                    {new Date(d.createdAt).toLocaleDateString()} · to {d.targets.map((t) => t.targetLabel).filter(Boolean).join(', ')}
                  </p>
                </div>
                <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-xs font-medium text-[#1E40AF]">{d.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
