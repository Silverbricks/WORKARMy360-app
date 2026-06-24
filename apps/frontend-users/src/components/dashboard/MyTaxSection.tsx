'use client';

import { type FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Engagement, TaxShare, WorkReadiness } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

export function MyTaxSection() {
  const [w, setW] = useState<WorkReadiness | null>(null);
  const [shares, setShares] = useState<TaxShare[]>([]);
  const [reveal, setReveal] = useState({ tfn: false, abn: false, bank: false });
  const [shareEmployer, setShareEmployer] = useState('');
  const [sharePw, setSharePw] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    api.workReadiness
      .get()
      .then((d) => {
        if (!active) return;
        setW(d);
        setShares(d.shares);
      })
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  function set<K extends keyof WorkReadiness>(key: K, value: WorkReadiness[K]) {
    setW((cur) => (cur ? { ...cur, [key]: value } : cur));
    setSaved(false);
  }

  async function save() {
    if (!w) return;
    setBusy(true);
    setError(null);
    try {
      const digits = (v: string | null) => (v ?? '').replace(/\D/g, '');
      const next = await api.workReadiness.update({
        engagement: (w.engagement ?? 'employee') as Engagement,
        tfn: digits(w.tfn),
        abn: digits(w.abn),
        hasSuper: w.hasSuper,
        superFund: w.superFund ?? '',
        superMember: w.superMember ?? '',
        bankBsb: digits(w.bankBsb),
        bankAccount: digits(w.bankAccount),
        noCashAck: w.noCashAck,
        bankLater: w.bankLater,
      });
      setW({ ...next });
      setShares(next.shares);
      setSaved(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function onShare(e: FormEvent) {
    e.preventDefault();
    if (!shareEmployer.trim()) return;
    setError(null);
    try {
      const created = await api.workReadiness.addShare({
        employer: shareEmployer.trim(),
        passwordProtected: sharePw,
      });
      setShares((prev) => [created, ...prev]);
      setShareEmployer('');
      setSharePw(false);
    } catch (e2) {
      setError(errorMessage(e2));
    }
  }

  if (loading || !w) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">My Tax</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">Your tax, super and payment details.</p>
      </div>

      <Card className="flex items-center gap-3 p-4" style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}>
        <span style={{ fontSize: 22 }}>🔒</span>
        <p className="text-sm text-[#1E40AF]">
          <span className="font-semibold">Only you can see this.</span> Tax details are never shown on
          your public profile — they&apos;re shared with an employer only when you choose to.
        </p>
      </Card>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {saved ? <Alert tone="success">Saved.</Alert> : null}

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#1E293B]">Tax File Number (TFN)</h2>
        <SecureField
          id="tfn"
          value={w.tfn ?? ''}
          revealed={reveal.tfn}
          onReveal={() => setReveal((r) => ({ ...r, tfn: !r.tfn }))}
          onChange={(v) => set('tfn', v)}
          placeholder="9-digit TFN"
        />
        <p className="mt-1.5 text-xs text-[#94A3B8]">Shared only with payroll on a confirmed job.</p>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#1E293B]">Superannuation</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="fund" label="Super fund">
            <Input id="fund" value={w.superFund ?? ''} onChange={(e) => set('superFund', e.target.value)} placeholder="e.g. AustralianSuper" />
          </Field>
          <Field id="member" label="Member number">
            <Input id="member" value={w.superMember ?? ''} onChange={(e) => set('superMember', e.target.value)} placeholder="Member no." />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#1E293B]">ABN (contract / sole-trader)</h2>
        <SecureField
          id="abn"
          value={w.abn ?? ''}
          revealed={reveal.abn}
          onReveal={() => setReveal((r) => ({ ...r, abn: !r.abn }))}
          onChange={(v) => set('abn', v)}
          placeholder="11-digit ABN"
        />
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#1E293B]">Bank details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="bsb" label="BSB">
            <Input id="bsb" value={w.bankBsb ?? ''} onChange={(e) => set('bankBsb', e.target.value)} placeholder="000000" />
          </Field>
          <div>
            <p className="mb-1.5 text-sm font-medium text-[#1E293B]">Account number</p>
            <SecureField
              id="acct"
              value={w.bankAccount ?? ''}
              revealed={reveal.bank}
              onReveal={() => setReveal((r) => ({ ...r, bank: !r.bank }))}
              onChange={(v) => set('bankAccount', v)}
              placeholder="Account no."
            />
          </div>
        </div>
      </Card>

      <Button loading={busy} onClick={save}>
        Save tax details
      </Button>

      <Card className="p-5">
        <h2 className="mb-1 text-sm font-semibold text-[#1E293B]">Share with an employer</h2>
        <p className="mb-3 text-xs text-[#64748B]">Nothing is shared until you do this.</p>
        <form onSubmit={onShare} className="space-y-3">
          <Field id="shareEmp" label="Employer">
            <Input id="shareEmp" value={shareEmployer} onChange={(e) => setShareEmployer(e.target.value)} placeholder="e.g. Green Valley Orchards" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-[#1E293B]">
            <input type="checkbox" checked={sharePw} onChange={(e) => setSharePw(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
            Protect with a password
          </label>
          <Button type="submit" variant="secondary">
            <Icon name="send" size={16} /> Share securely
          </Button>
        </form>
        {shares.length > 0 ? (
          <ul className="mt-4 divide-y divide-[#F1F5F9]">
            {shares.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-[#1E293B]">{s.employer}{s.passwordProtected ? ' 🔒' : ''}</span>
                <span className="text-xs text-[#94A3B8]">{new Date(s.sharedAt).toLocaleDateString('en-AU')}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3 p-5" style={{ backgroundColor: '#F0FDFA', borderColor: '#99F6E4' }}>
        <div>
          <p className="font-medium text-[#1E293B]">Need to lodge a tax return?</p>
          <p className="text-sm text-[#64748B]">Personal or business/ABN — we can help or connect a registered agent.</p>
        </div>
        <Link href="/dashboard/lodge-tax">
          <Button variant="secondary">Lodge tax return →</Button>
        </Link>
      </Card>
    </div>
  );
}

function SecureField({
  id,
  value,
  revealed,
  onReveal,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  revealed: boolean;
  onReveal: () => void;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        id={id}
        type={revealed ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      <button
        type="button"
        onClick={onReveal}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[#E5E7EB] text-[#64748B] hover:bg-[#F8FAFC]"
        aria-label={revealed ? 'Hide' : 'Show'}
      >
        <Icon name={revealed ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  );
}
