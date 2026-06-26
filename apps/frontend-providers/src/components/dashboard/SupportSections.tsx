'use client';

import { type FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Feedback, Notification, UserSettings } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { MessagesSection } from './MessagesSection';

type Tab = 'messages' | 'notifications' | 'help' | 'faq' | 'settings';
const TABS: { key: Tab; label: string }[] = [
  { key: 'messages', label: 'Messages' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'help', label: 'Support Hub' },
  { key: 'faq', label: 'FAQ' },
  { key: 'settings', label: 'Settings' },
];

export function SupportSection() {
  const tabParam = (useSearchParams().get('tab') as Tab) || 'messages';
  const tab: Tab = TABS.some((t) => t.key === tabParam) ? tabParam : 'messages';
  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Support</h1>
      <div className="flex flex-wrap gap-1 border-b border-[#E5E7EB]">
        {TABS.map((t) => (
          <Link key={t.key} href={`/dashboard/support?tab=${t.key}`}
            className={cn('border-b-2 px-3.5 py-2 text-sm font-medium', tab === t.key ? '' : 'border-transparent text-[#94A3B8]')}
            style={tab === t.key ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}>
            {t.label}
          </Link>
        ))}
      </div>
      {tab === 'messages' ? <MessagesSection /> : null}
      {tab === 'notifications' ? <Notifications /> : null}
      {tab === 'help' ? <HelpHub /> : null}
      {tab === 'faq' ? <Faq /> : null}
      {tab === 'settings' ? <Settings /> : null}
    </div>
  );
}

function Notifications() {
  const [rows, setRows] = useState<Notification[]>([]);
  const load = () => api.support.notifications().then(setRows).catch(() => {});
  useEffect(() => {
    void load();
  }, []);
  async function markAll() {
    setRows((r) => r.map((n) => ({ ...n, read: true })));
    try { await api.support.markAllRead(); } catch { /* optimistic */ }
  }
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-[#1E293B]">Notifications</p>
        {rows.some((n) => !n.read) ? <button type="button" onClick={markAll} className="text-xs font-medium" style={{ color: 'var(--accent)' }}>Mark all read</button> : null}
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#94A3B8]">You&apos;re all caught up.</p>
      ) : (
        <ul className="divide-y divide-[#E5E7EB]">
          {rows.map((n) => (
            <li key={n.id} className={cn('py-3', !n.read && 'bg-[color-mix(in_srgb,var(--accent)_5%,white)]')}>
              <p className="text-sm font-medium text-[#1E293B]">{n.title}</p>
              {n.body ? <p className="mt-0.5 text-xs text-[#64748B]">{n.body}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function HelpHub() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="p-5">
        <p className="mb-2 font-semibold text-[#1E293B]">Get help</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/support?tab=faq"><Button>FAQ</Button></Link>
          <Link href="/dashboard/feedback"><Button variant="secondary">Send feedback</Button></Link>
        </div>
      </Card>
      <Card className="p-5">
        <p className="mb-1 font-semibold text-[#1E293B]">Account manager</p>
        <p className="text-sm text-[#64748B]">Growth &amp; Enterprise plans include a dedicated account manager.</p>
      </Card>
    </div>
  );
}

function Faq() {
  const qs: [string, string][] = [
    ['How do I post a job?', 'Go to Post a Job, fill in the role, pay basis and requirements, then publish (your business must be verified).'],
    ['How are workers verified?', 'Workers complete 100-point ID, work-rights and certification checks. Verified workers show a ✓ badge.'],
    ['How do pay runs work?', 'Issued payslips feed a pay run that totals PAYG and super automatically; finalise to flag ABA/STP.'],
    ['What is the LHA licence?', 'Labour-hire providers in VIC/QLD/SA/ACT must hold a Labour Hire Authority licence to supply workers.'],
  ];
  return (
    <Card className="p-2">
      {qs.map(([q, a]) => (
        <div key={q} className="border-b border-[#F1F5F9] p-3 last:border-0">
          <p className="text-sm font-medium text-[#1E293B]">{q}</p>
          <p className="mt-1 text-xs text-[#64748B]">{a}</p>
        </div>
      ))}
    </Card>
  );
}

function Settings() {
  const [s, setS] = useState<UserSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api.support.settings().then(setS).catch((e) => setError(errorMessage(e)));
  }, []);
  async function toggle(key: keyof UserSettings, value: boolean) {
    setS((cur) => (cur ? { ...cur, [key]: value } : cur));
    try { await api.support.updateSettings({ [key]: value }); } catch (e) { setError(errorMessage(e)); }
  }
  if (!s) return <Card className="p-8 text-center text-sm text-[#64748B]">Loading…</Card>;
  const rows: { key: keyof UserSettings; label: string }[] = [
    { key: 'notifyJobs', label: 'New applicants & job updates' },
    { key: 'notifyMessages', label: 'Messages' },
    { key: 'notifyCompliance', label: 'Compliance & expiry alerts' },
  ];
  return (
    <Card className="p-5">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <p className="mb-2 text-sm font-semibold text-[#1E293B]">Notifications</p>
      {rows.map((r) => (
        <label key={r.key} className="flex items-center justify-between border-b border-[#F1F5F9] py-3 text-sm last:border-0">
          <span>{r.label}</span>
          <input type="checkbox" checked={!!s[r.key]} onChange={(e) => toggle(r.key, e.target.checked)} />
        </label>
      ))}
    </Card>
  );
}

export function FeedbackSection() {
  const [rows, setRows] = useState<Feedback[]>([]);
  const [about, setAbout] = useState('About WorkArmy');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const load = () => api.community.myFeedback().then(setRows).catch(() => {});
  useEffect(() => {
    void load();
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return setError('Add some comments.');
    setError(null);
    try {
      await api.community.submitFeedback({ kind: about, message });
      setMessage('');
      setInfo('Feedback submitted — thank you.');
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    }
  }
  const selectCls = 'h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]';
  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Feedback</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {info ? <Alert tone="success">{info}</Alert> : null}
      <Card className="p-5">
        <form onSubmit={submit} className="space-y-3">
          <Field id="fbAbout" label="About"><select id="fbAbout" value={about} onChange={(e) => setAbout(e.target.value)} className={selectCls}>{['About WorkArmy', 'About a staff member', 'About my process', 'About a provider/agency'].map((o) => <option key={o}>{o}</option>)}</select></Field>
          <Field id="fbMsg" label="Comments"><Input id="fbMsg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your feedback…" /></Field>
          <Button type="submit">Submit feedback</Button>
        </form>
      </Card>
      {rows.length > 0 ? (
        <Card className="p-4">
          <p className="mb-2 text-sm font-semibold text-[#1E293B]">Submitted ({rows.length})</p>
          <ul className="divide-y divide-[#E5E7EB]">
            {rows.map((r) => (
              <li key={r.id} className="py-3 text-sm">
                <p className="font-medium text-[#1E293B]">{r.kind}</p>
                <p className="text-xs text-[#64748B]">{r.message}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
