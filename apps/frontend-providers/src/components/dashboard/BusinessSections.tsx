'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type {
  BusinessCard,
  MemberInvoice,
  Plan,
  Requirement,
  RequirementKind,
  Subscription,
} from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { useMe } from './DashboardShell';

const money = (c: number) => '$' + (c / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const planPrice = (p: Plan) => (p.priceCents > 0 ? `$${p.priceCents / 100}/${p.interval}` : p.code === 'enterprise' ? 'Custom' : '$0');
const selectCls =
  'h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]';

// ---- Membership & Billing ----
export function BillingSection() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<MemberInvoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pay, setPay] = useState({ last4: '', brand: 'Visa' });

  async function load() {
    const [p, s, i] = await Promise.all([api.business.plans(), api.business.subscription.get(), api.business.memberInvoices()]);
    setPlans(p);
    setSub(s);
    setInvoices(i);
  }
  useEffect(() => {
    load().catch((e) => setError(errorMessage(e)));
  }, []);

  async function choose(code: string) {
    setError(null);
    setInfo(null);
    try {
      await api.business.subscription.subscribe({ planCode: code });
      setInfo('Plan updated.');
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function cancel() {
    try { await api.business.subscription.cancel(); await load(); } catch (e) { setError(errorMessage(e)); }
  }
  async function savePay(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(pay.last4)) return setError('Enter the last 4 digits.');
    try { await api.business.subscription.setPayment(pay); setInfo('Payment method saved.'); await load(); } catch (e2) { setError(errorMessage(e2)); }
  }

  const current = plans.find((p) => p.code === sub?.planCode);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Membership &amp; Billing</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {info ? <Alert tone="success">{info}</Alert> : null}

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1">
            <p className="font-display text-2xl font-semibold text-[#1E293B]">{current?.name ?? 'Free'} plan</p>
            <p className="text-sm text-[#64748B]">{current ? planPrice(current) : '$0'} · {sub?.status ?? 'ACTIVE'}{sub?.currentPeriodEnd ? ` · renews ${sub.currentPeriodEnd}` : ''}</p>
          </div>
          <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', sub?.status === 'CANCELLED' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#DCFCE7] text-[#166534]')}>{sub?.status ?? 'ACTIVE'}</span>
          {sub && sub.status !== 'CANCELLED' && sub.planCode !== 'free' ? <Button variant="secondary" onClick={cancel}>Cancel</Button> : null}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = p.code === sub?.planCode;
          return (
            <Card key={p.code} className="flex flex-col p-5" style={isCurrent ? { borderColor: 'var(--accent)', backgroundColor: 'color-mix(in srgb, var(--accent) 5%, white)' } : undefined}>
              <p className="font-medium text-[#1E293B]">{p.name} {isCurrent ? <span style={{ color: 'var(--accent)' }}>· current</span> : null}</p>
              <p className="font-display text-2xl" style={{ color: 'var(--accent)' }}>{planPrice(p)}</p>
              <ul className="my-3 flex-1 space-y-1 text-xs text-[#64748B]">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-1.5"><Icon name="check" size={13} className="mt-0.5 shrink-0 text-[#166534]" />{f}</li>
                ))}
              </ul>
              {isCurrent ? (
                <Button variant="secondary" disabled>Current plan</Button>
              ) : (
                <Button onClick={() => choose(p.code)}>Switch →</Button>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold text-[#1E293B]">Payment method</p>
        <p className="mb-3 text-sm text-[#64748B]">{sub?.paymentBrand ? `${sub.paymentBrand} •••• ${sub.paymentLast4}` : 'No card on file.'}</p>
        <form onSubmit={savePay} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field id="payBrand" label="Card brand"><select id="payBrand" value={pay.brand} onChange={(e) => setPay({ ...pay, brand: e.target.value })} className={selectCls}>{['Visa', 'Mastercard', 'Amex'].map((b) => <option key={b}>{b}</option>)}</select></Field>
          <Field id="payLast4" label="Last 4 digits"><Input id="payLast4" value={pay.last4} onChange={(e) => setPay({ ...pay, last4: e.target.value })} placeholder="4242" maxLength={4} /></Field>
          <Button type="submit">Save card</Button>
        </form>
      </Card>

      <Card className="p-4">
        <p className="mb-2 text-sm font-semibold text-[#1E293B]">Billing history</p>
        {invoices.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#94A3B8]">No invoices yet (Free plan).</p>
        ) : (
          <ul className="divide-y divide-[#E5E7EB]">
            {invoices.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3 text-sm">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F1F5F9]"><Icon name="receipt" size={16} /></span>
                <div className="min-w-0 flex-1"><p className="font-medium text-[#1E293B]">{m.number}</p><p className="text-xs text-[#64748B]">{m.issuedAt} · {money(m.amountCents)}</p></div>
                <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-medium text-[#166534]">{m.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ---- Business Card & Page ----
export function BusinessCardSection() {
  const me = useMe();
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    api.business.card.get().then(setCard).catch((e) => setError(errorMessage(e)));
  }, []);

  function set<K extends keyof BusinessCard>(k: K, v: BusinessCard[K]) {
    setCard((c) => (c ? { ...c, [k]: v } : c));
  }
  async function save() {
    if (!card) return;
    setError(null);
    try {
      const saved = await api.business.card.update({
        headline: card.headline ?? undefined,
        tagline: card.tagline ?? undefined,
        about: card.about ?? undefined,
        publicSlug: card.publicSlug ?? undefined,
        published: card.published,
        contactEmail: card.contactEmail ?? undefined,
        contactPhone: card.contactPhone ?? undefined,
      });
      setCard(saved);
      setInfo('Business page saved.');
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (!card) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Business Card &amp; Page</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {info ? <Alert tone="success">{info}</Alert> : null}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <Field id="bcHead" label="Headline"><Input id="bcHead" value={card.headline ?? ''} onChange={(e) => set('headline', e.target.value)} placeholder={me.organisation.name} /></Field>
          <Field id="bcTag" label="Tagline"><Input id="bcTag" value={card.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} placeholder="Reliable labour, ready when you are." /></Field>
          <Field id="bcAbout" label="About"><Input id="bcAbout" value={card.about ?? ''} onChange={(e) => set('about', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="bcEmail" label="Contact email"><Input id="bcEmail" value={card.contactEmail ?? ''} onChange={(e) => set('contactEmail', e.target.value)} /></Field>
            <Field id="bcPhone" label="Contact phone"><Input id="bcPhone" value={card.contactPhone ?? ''} onChange={(e) => set('contactPhone', e.target.value)} /></Field>
          </div>
          <Field id="bcSlug" label="Public page URL"><Input id="bcSlug" value={card.publicSlug ?? ''} onChange={(e) => set('publicSlug', e.target.value)} placeholder="your-business" /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={card.published} onChange={(e) => set('published', e.target.checked)} /> Publish public page</label>
          <Button onClick={save}>Save page</Button>
        </Card>

        <div>
          <Card className="border-none bg-[#1C1B1F] p-6 text-white">
            <div className="mb-3 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-lg text-lg font-semibold" style={{ backgroundColor: 'var(--accent)' }}>{me.organisation.name.slice(0, 2).toUpperCase()}</span>
              <div><p className="font-display text-lg font-semibold">{card.headline || me.organisation.name}</p><p className="text-xs text-[#94A3B8]">{me.organisation.accountType.replace(/_/g, ' ')}</p></div>
            </div>
            {card.tagline ? <p className="mb-3 text-sm text-[#D5D3DD]">{card.tagline}</p> : null}
            <div className="space-y-0.5 text-xs text-[#B7B4BF]">
              {card.contactPhone ? <p>📞 {card.contactPhone}</p> : null}
              {card.contactEmail ? <p>✉️ {card.contactEmail}</p> : null}
              {card.publicSlug ? <p>🔗 platform.workarmy.com.au/{card.publicSlug}</p> : null}
            </div>
            <span className={cn('mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold', card.published ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-white/10 text-[#B7B4BF]')}>{card.published ? 'Published' : 'Draft'}</span>
          </Card>
          <p className="mt-2 px-1 text-xs text-[#94A3B8]">Preview of your on-site card / public page.</p>
        </div>
      </div>
    </div>
  );
}

// ---- My Requirements ----
const REQ_KINDS: { v: RequirementKind; label: string }[] = [
  { v: 'NEED_STAFF', label: 'Need staff / workers' },
  { v: 'NEED_CLIENTS', label: 'Need clients / customers' },
  { v: 'OFFER_SERVICE', label: 'Offer a service' },
];
export function RequirementsSection() {
  const [rows, setRows] = useState<Requirement[]>([]);
  const [f, setF] = useState({ kind: 'NEED_STAFF', audience: 'BOTH', title: '', location: '' });
  const [error, setError] = useState<string | null>(null);
  const load = () => api.business.requirements.list().then(setRows).catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    void load();
  }, []);
  async function add(e: FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) return setError('Describe the requirement.');
    try {
      await api.business.requirements.create({ kind: f.kind as RequirementKind, audience: f.audience as Requirement['audience'], title: f.title, location: f.location || undefined });
      setF({ kind: 'NEED_STAFF', audience: 'BOTH', title: '', location: '' });
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    }
  }
  async function close(id: string) { try { await api.business.requirements.close(id); await load(); } catch (e) { setError(errorMessage(e)); } }
  async function remove(id: string) { try { await api.business.requirements.remove(id); await load(); } catch (e) { setError(errorMessage(e)); } }
  return (
    <div className="space-y-5">
      <h1 className="text-2xl">My Requirements</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Card className="p-5">
        <form onSubmit={add} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="rKind" label="What do you need?"><select id="rKind" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className={selectCls}>{REQ_KINDS.map((k) => <option key={k.v} value={k.v}>{k.label}</option>)}</select></Field>
            <Field id="rAud" label="Audience"><select id="rAud" value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })} className={selectCls}>{['BOTH', 'B2B', 'B2C'].map((a) => <option key={a}>{a}</option>)}</select></Field>
          </div>
          <Field id="rTitle" label="Describe the requirement"><Input id="rTitle" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. 15 pickers for Sep–Dec season" /></Field>
          <Field id="rLoc" label="Location (optional)"><Input id="rLoc" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></Field>
          <Button type="submit">+ Post requirement</Button>
        </form>
      </Card>
      {rows.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#94A3B8]">No requirements posted yet.</Card>
      ) : (
        <Card className="p-4"><ul className="divide-y divide-[#E5E7EB]">{rows.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-3 text-sm">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F1F5F9]"><Icon name="lightbulb" size={16} /></span>
            <div className="min-w-0 flex-1"><p className="font-medium text-[#1E293B]">{r.title}</p><p className="text-xs text-[#64748B]">{r.kind.replace(/_/g, ' ').toLowerCase()} · {r.audience}{r.location ? ` · ${r.location}` : ''}</p></div>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', r.status === 'OPEN' ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#F1F5F9] text-[#64748B]')}>{r.status}</span>
            {r.status === 'OPEN' ? <Button size="sm" variant="ghost" onClick={() => close(r.id)}>Close</Button> : null}
            <button type="button" onClick={() => remove(r.id)} className="text-[#94A3B8] hover:text-[#991B1B]" aria-label="Remove"><Icon name="trash" size={16} /></button>
          </li>
        ))}</ul></Card>
      )}
    </div>
  );
}
