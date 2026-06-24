'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { ServiceCategory, ServiceKind, ServiceListing } from '@workarmy/types';
import { Alert, Button, Card, Field, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

type Tab = 'ACCOMMODATION' | 'TRANSPORT' | 'other';

const inputCls =
  'h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]';
const areaCls =
  'min-h-[80px] w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]';

const kindLabel: Record<ServiceKind, string> = { HAVE: 'Offering', NEED: 'Looking for', SHARE: 'Share' };
const kindTone: Record<ServiceKind, string> = {
  HAVE: 'bg-[#DCFCE7] text-[#166534]',
  NEED: 'bg-[#EFF6FF] text-[#1E40AF]',
  SHARE: 'bg-[#FEF9C3] text-[#854D0E]',
};

export function ServicesSection() {
  const [tab, setTab] = useState<Tab>('ACCOMMODATION');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ACCOMMODATION', label: 'Accommodation' },
    { key: 'TRANSPORT', label: 'Transport' },
    { key: 'other', label: 'More services' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Workforce Services</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">Accommodation, transport, finance, wellbeing and rewards.</p>
      </div>

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

      {tab === 'ACCOMMODATION' ? <Listings category="ACCOMMODATION" /> : null}
      {tab === 'TRANSPORT' ? <Listings category="TRANSPORT" /> : null}
      {tab === 'other' ? <OtherServices /> : null}
    </div>
  );
}

function Listings({ category }: { category: ServiceCategory }) {
  const [items, setItems] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [kind, setKind] = useState<ServiceKind>(category === 'TRANSPORT' ? 'SHARE' : 'NEED');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setItems(await api.services.list(category));
  }
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (active) setError(errorMessage(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.services.create({ category, kind, title, details: details || undefined, location: location || undefined });
      setTitle('');
      setDetails('');
      setLocation('');
      setShow(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await api.services.remove(id);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (loading) return <div className="py-10 text-center text-[#64748B]">Loading…</div>;

  return (
    <div className="space-y-4">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="flex justify-end">
        <Button onClick={() => setShow((s) => !s)}>{show ? 'Cancel' : 'Post a listing'}</Button>
      </div>
      {show ? (
        <Card className="p-6">
          <form onSubmit={create} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="kind" label="Type">
              <select id="kind" value={kind} onChange={(e) => setKind(e.target.value as ServiceKind)} className={inputCls}>
                <option value="NEED">I need</option>
                <option value="HAVE">I have</option>
                <option value="SHARE">Share</option>
              </select>
            </Field>
            <Field id="loc" label="Location">
              <Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field id="title" label="Title">
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={category === 'TRANSPORT' ? 'e.g. Ride-share Mildura → farm' : 'e.g. Room available near CBD'} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field id="details" label="Details">
                <textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} className={areaCls} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" loading={busy}>Post</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {items.length === 0 ? (
        <Card className="p-6 text-sm text-[#64748B]">No listings yet. Be the first to post.</Card>
      ) : (
        <div className="space-y-3">
          {items.map((i) => (
            <Card key={i.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${kindTone[i.kind]}`}>{kindLabel[i.kind]}</span>
                    <span className="font-medium text-[#1E293B]">{i.title}</span>
                  </div>
                  <div className="mt-0.5 text-sm text-[#64748B]">{[i.location, `by ${i.by}`].filter(Boolean).join(' · ')}</div>
                  {i.details ? <p className="mt-1 text-sm text-[#475569]">{i.details}</p> : null}
                </div>
                {i.mine ? (
                  <button type="button" onClick={() => remove(i.id)} className="text-sm text-[#DC2626] hover:underline">Remove</button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function OtherServices() {
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function enquire(category: string, subject: string) {
    setError(null);
    try {
      await api.support.createTicket({ category, subject, body: `I'd like more information about ${subject}.` });
      setSent(category);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const services = [
    { cat: 'Financial', title: 'Financial services', text: 'Tax return assistance, superannuation tracking and worker insurance.' },
    { cat: 'Wellbeing', title: 'Wellbeing services', text: 'Wellness resources, mental-health support and employee assistance.' },
    { cat: 'Family', title: 'Family services', text: 'Family & dependant support and emergency contacts.' },
  ];

  return (
    <div className="space-y-4">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {services.map((s) => (
          <Card key={s.cat} className="p-5">
            <div className="font-medium text-[#1E293B]">{s.title}</div>
            <p className="mt-1 text-sm text-[#64748B]">{s.text}</p>
            {sent === s.cat ? (
              <p className="mt-3 text-sm text-[#16A34A]">Enquiry sent — we’ll be in touch.</p>
            ) : (
              <Button size="sm" variant="secondary" className="mt-3" onClick={() => enquire(s.cat, s.title)}>Enquire</Button>
            )}
          </Card>
        ))}
        <Card className="p-5">
          <div className="font-medium text-[#1E293B]">Career services</div>
          <p className="mt-1 text-sm text-[#64748B]">Career planning and learning — see the Community knowledge hub.</p>
        </Card>
        <Card className="p-5">
          <div className="font-medium text-[#1E293B]">Rewards program</div>
          <p className="mt-1 text-sm text-[#64748B]">Marketplace discounts, loyalty rewards and referral bonuses are coming soon.</p>
        </Card>
      </div>
    </div>
  );
}
