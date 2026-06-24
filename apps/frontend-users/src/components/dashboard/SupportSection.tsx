'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type {
  ConversationThread,
  ConversationView,
  Notification,
  SupportTicket,
  UserSettings,
} from '@workarmy/types';
import { Alert, Button, Card, Field, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

type Tab = 'notifications' | 'messages' | 'report' | 'settings' | 'help';

const inputCls =
  'h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]';
const areaCls =
  'min-h-[90px] w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]';

const TICKET_CATEGORIES = ['Workplace', 'Payroll', 'Safety', 'Accommodation', 'Transport', 'Emergency', 'Other'];

export function SupportSection() {
  const [tab, setTab] = useState<Tab>('notifications');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadBase() {
    const [n, t] = await Promise.all([api.support.notifications(), api.support.tickets()]);
    setNotifications(n);
    setTickets(t);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await loadBase();
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

  const unread = notifications.filter((n) => !n.read).length;

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'notifications', label: `Notifications${unread ? ` (${unread})` : ''}` },
    { key: 'messages', label: 'Messages' },
    { key: 'report', label: 'Report an issue' },
    { key: 'settings', label: 'Settings' },
    { key: 'help', label: 'Help' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Support Centre</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">Notifications, messages, issues and settings.</p>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn('rounded-lg px-3 py-1.5 text-sm', tab === t.key ? 'text-white' : 'bg-[#F1F5F9] text-[#64748B]')}
            style={tab === t.key ? { backgroundColor: 'var(--accent)' } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'notifications' && (
        <div className="space-y-3">
          {notifications.length > 0 ? (
            <div className="flex justify-end">
              <Button size="sm" variant="secondary" onClick={async () => { await api.support.markAllRead(); await loadBase(); }}>
                Mark all read
              </Button>
            </div>
          ) : null}
          {notifications.length === 0 ? (
            <Card className="p-6 text-sm text-[#64748B]">No notifications yet.</Card>
          ) : (
            notifications.map((n) => (
              <Card key={n.id} className={cn('p-4', !n.read && 'border-l-4')} style={!n.read ? { borderLeftColor: 'var(--accent)' } : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-[#1E293B]">{n.title}</div>
                    {n.body ? <div className="mt-0.5 text-sm text-[#64748B]">{n.body}</div> : null}
                    <div className="mt-1 text-xs text-[#94A3B8]">{new Date(n.createdAt).toLocaleString('en-AU')}</div>
                  </div>
                  {!n.read ? (
                    <button type="button" onClick={async () => { await api.support.markRead(n.id); await loadBase(); }} className="shrink-0 text-xs" style={{ color: 'var(--accent)' }}>
                      Mark read
                    </button>
                  ) : null}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'messages' && <MessagesTab />}

      {tab === 'report' && (
        <ReportTab tickets={tickets} onCreated={loadBase} />
      )}

      {tab === 'settings' && <SettingsTab />}

      {tab === 'help' && (
        <Card className="p-6 space-y-3 text-sm text-[#475569]">
          <h2 className="text-lg font-semibold text-[#1E293B]">Help &amp; FAQs</h2>
          <p><strong>How do I get verified?</strong> Upload your ID and licences in Qualifications &amp; Compliance, then tap “Request verification”.</p>
          <p><strong>How do I get paid?</strong> Clock in/out of your shifts, generate your weekly timesheet in Work &amp; Earnings, and your employer issues a payslip.</p>
          <p><strong>Found a bug or have an idea?</strong> Use Community → Share your ideas.</p>
          <p>For work-rights and pay-rate guides, see the <span className="font-medium">Community knowledge hub</span>.</p>
        </Card>
      )}
    </div>
  );
}

function ReportTab({ tickets, onCreated }: { tickets: SupportTicket[]; onCreated: () => Promise<void> }) {
  const [category, setCategory] = useState('Workplace');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.support.createTicket({ category, subject, body });
      setSubject('');
      setBody('');
      setDone(true);
      await onCreated();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="mb-3 text-lg font-semibold text-[#1E293B]">Report an issue</h2>
        {error ? <div className="mb-3"><Alert tone="error">{error}</Alert></div> : null}
        {done ? <div className="mb-3"><Alert tone="success">Thanks — we’ve logged your report.</Alert></div> : null}
        <form onSubmit={submit} className="space-y-4">
          <Field id="cat" label="Category">
            <select id="cat" value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {TICKET_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field id="subj" label="Subject">
            <Input id="subj" value={subject} onChange={(e) => { setSubject(e.target.value); setDone(false); }} />
          </Field>
          <Field id="body" label="Describe the issue">
            <textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} className={areaCls} />
          </Field>
          <Button type="submit" loading={busy}>Submit report</Button>
        </form>
      </Card>

      {tickets.length > 0 ? (
        <Card className="p-6">
          <h3 className="mb-3 text-sm font-medium text-[#1E293B]">Your reports</h3>
          <ul className="space-y-2">
            {tickets.map((t) => (
              <li key={t.id} className="rounded-lg border border-[#E5E7EB] p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#1E293B]">{t.subject}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${t.status === 'OPEN' ? 'bg-[#FEF9C3] text-[#854D0E]' : 'bg-[#DCFCE7] text-[#166534]'}`}>{t.status}</span>
                </div>
                <div className="mt-0.5 text-xs text-[#94A3B8]">{t.category}</div>
                <p className="mt-1 text-[#475569]">{t.body}</p>
                {t.response ? <p className="mt-2 rounded bg-[#F8FAFC] p-2 text-[#475569]"><strong>Support:</strong> {t.response}</p> : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

function MessagesTab() {
  const [convs, setConvs] = useState<ConversationView[]>([]);
  const [thread, setThread] = useState<ConversationThread | null>(null);
  const [draft, setDraft] = useState('');
  const [startWa, setStartWa] = useState('');
  const [startMsg, setStartMsg] = useState('');
  const [showStart, setShowStart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadConvs() {
    setConvs(await api.support.conversations());
  }
  useEffect(() => {
    loadConvs().catch((e) => setError(errorMessage(e)));
  }, []);

  async function open(id: string) {
    setError(null);
    try {
      setThread(await api.support.thread(id));
      await loadConvs();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function send(e: FormEvent) {
    e.preventDefault();
    if (!thread || !draft.trim()) return;
    try {
      setThread(await api.support.sendMessage(thread.id, { body: draft }));
      setDraft('');
      await loadConvs();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function start(e: FormEvent) {
    e.preventDefault();
    try {
      const t = await api.support.startConversation({ orgWaId: startWa, body: startMsg });
      setThread(t);
      setStartWa('');
      setStartMsg('');
      setShowStart(false);
      await loadConvs();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <div className="space-y-4">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          <Button size="sm" fullWidth variant="secondary" onClick={() => setShowStart((s) => !s)}>{showStart ? 'Cancel' : 'New message'}</Button>
          {showStart ? (
            <Card className="p-3">
              <form onSubmit={start} className="space-y-2">
                <Input value={startWa} onChange={(e) => setStartWa(e.target.value)} placeholder="Organisation WA ID" />
                <textarea value={startMsg} onChange={(e) => setStartMsg(e.target.value)} className={areaCls} placeholder="Message" />
                <Button size="sm" type="submit" fullWidth>Send</Button>
              </form>
            </Card>
          ) : null}
          {convs.length === 0 ? (
            <Card className="p-4 text-sm text-[#64748B]">No conversations.</Card>
          ) : (
            convs.map((c) => (
              <button key={c.id} type="button" onClick={() => open(c.id)} className="w-full text-left">
                <Card className={cn('p-3 transition hover:bg-[#F8FAFC]', thread?.id === c.id && 'ring-2 ring-[color:var(--accent)]')}>
                  <div className="flex items-center justify-between">
                    <span className="truncate font-medium text-[#1E293B]">{c.counterparty.name}</span>
                    {c.unread > 0 ? <span className="rounded-full px-1.5 text-xs text-white" style={{ backgroundColor: 'var(--accent)' }}>{c.unread}</span> : null}
                  </div>
                  <div className="truncate text-xs text-[#64748B]">{c.lastMessage ?? '—'}</div>
                </Card>
              </button>
            ))
          )}
        </div>

        <Card className="flex min-h-[320px] flex-col p-4">
          {thread ? (
            <>
              <div className="border-b border-[#E5E7EB] pb-2 font-medium text-[#1E293B]">{thread.counterparty.name}</div>
              <div className="flex-1 space-y-2 overflow-y-auto py-3">
                {thread.messages.map((m) => (
                  <div key={m.id} className={cn('max-w-[80%] rounded-lg px-3 py-2 text-sm', m.mine ? 'ml-auto text-white' : 'bg-[#F1F5F9] text-[#1E293B]')} style={m.mine ? { backgroundColor: 'var(--accent)' } : undefined}>
                    {m.body}
                  </div>
                ))}
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-[#E5E7EB] pt-3">
                <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message…" />
                <Button type="submit">Send</Button>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-sm text-[#94A3B8]">Select a conversation</div>
          )}
        </Card>
      </div>
    </div>
  );
}

function SettingsTab() {
  const [s, setS] = useState<UserSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.support.settings().then(setS).catch((e) => setError(errorMessage(e)));
  }, []);

  async function save() {
    if (!s) return;
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      setS(await api.support.updateSettings(s));
      setSaved(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (!s) return <Card className="p-6 text-sm text-[#64748B]">Loading…</Card>;

  const toggles: { key: keyof UserSettings; label: string }[] = [
    { key: 'notifyJobs', label: 'Job alerts & matches' },
    { key: 'notifyMessages', label: 'Message notifications' },
    { key: 'notifyCompliance', label: 'Compliance & expiry reminders' },
    { key: 'profilePublic', label: 'Allow my profile to be discoverable' },
  ];

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-lg font-semibold text-[#1E293B]">Settings</h2>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {saved ? <Alert tone="success">Settings saved.</Alert> : null}
      <div className="space-y-3">
        {toggles.map((t) => (
          <label key={t.key} className="flex items-center justify-between gap-4 text-sm text-[#1E293B]">
            <span>{t.label}</span>
            <input type="checkbox" checked={Boolean(s[t.key])} onChange={(e) => setS({ ...s, [t.key]: e.target.checked })} />
          </label>
        ))}
      </div>
      <Field id="lang" label="Language">
        <select id="lang" value={s.language} onChange={(e) => setS({ ...s, language: e.target.value })} className={inputCls}>
          <option value="en-AU">English (Australia)</option>
          <option value="en">English</option>
        </select>
      </Field>
      <p className="text-xs text-[#94A3B8]">To change your password, log out and use “Forgot password”. Two-factor authentication is coming soon.</p>
      <Button onClick={save} loading={busy}>Save settings</Button>
    </Card>
  );
}
