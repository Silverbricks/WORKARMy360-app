'use client';

import { useEffect, useState } from 'react';
import type { Engagement, WorkReadiness } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

function checklist(w: WorkReadiness) {
  const idOk = w.engagement === 'contract' ? /^\d{11}$/.test(w.abn ?? '') : (w.tfn ?? '').length >= 8;
  return {
    idOk,
    superOk: !!w.superFund,
    bankOk: !!(w.bankBsb && w.bankAccount),
    cashOk: w.noCashAck,
  };
}

export function WorkReadinessSection() {
  const [w, setW] = useState<WorkReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.workReadiness
      .get()
      .then((d) => active && setW(d))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  function set<K extends keyof WorkReadiness>(key: K, value: WorkReadiness[K]) {
    setW((cur) => (cur ? { ...cur, [key]: value } : cur));
  }

  async function save() {
    if (!w) return;
    setBusy(true);
    setError(null);
    try {
      const next = await api.workReadiness.update({
        engagement: (w.engagement ?? 'employee') as Engagement,
        tfn: w.tfn ?? '',
        abn: w.abn ?? '',
        hasSuper: w.hasSuper,
        superFund: w.superFund ?? '',
        superMember: w.superMember ?? '',
        bankBsb: w.bankBsb ?? '',
        bankAccount: w.bankAccount ?? '',
        noCashAck: w.noCashAck,
        bankLater: w.bankLater,
      });
      setW(next);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading || !w) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  const c = checklist(w);
  const contract = w.engagement === 'contract';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">{w.workReady ? 'Work Ready ✓' : 'Work Readiness'}</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">
          {w.workReady
            ? 'You’re cleared to accept jobs and shifts.'
            : 'Complete these before you can accept a shift or apply for jobs.'}
        </p>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {w.workReady ? (
        <Card className="flex items-center gap-2.5 p-4" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
          <span className="text-[#16A34A]"><Icon name="check" size={18} /></span>
          <p className="text-sm font-medium text-[#166534]">All set — you can accept jobs &amp; shifts.</p>
        </Card>
      ) : null}

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#1E293B]">Checklist</h2>
        <ul className="space-y-2">
          <Check ok={c.idOk} label={contract ? 'ABN (contract work)' : 'TFN (employee work)'} />
          <Check ok={c.superOk} label="Superannuation fund" />
          <Check ok={c.bankOk} label="Bank account" />
          <Check ok={c.cashOk} label="No-cash work policy acknowledged" />
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#1E293B]">Engagement type</h2>
        <div className="flex flex-wrap gap-2">
          {(['employee', 'contract'] as const).map((eng) => (
            <button
              key={eng}
              type="button"
              onClick={() => set('engagement', eng)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                w.engagement === eng ? 'text-white' : 'bg-[#F1F5F9] text-[#64748B]',
              )}
              style={w.engagement === eng ? { backgroundColor: 'var(--accent)' } : undefined}
            >
              {eng === 'employee' ? 'Employee (TFN)' : 'Contractor (ABN)'}
            </button>
          ))}
        </div>
        <div className="mt-4">
          {contract ? (
            <Field id="abn" label="ABN (11 digits)">
              <Input id="abn" value={w.abn ?? ''} onChange={(e) => set('abn', e.target.value)} placeholder="11-digit ABN" />
            </Field>
          ) : (
            <Field id="tfn" label="Tax File Number">
              <Input id="tfn" value={w.tfn ?? ''} onChange={(e) => set('tfn', e.target.value)} placeholder="Your TFN" />
            </Field>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#1E293B]">Superannuation</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="superFund" label="Super fund">
            <Input id="superFund" value={w.superFund ?? ''} onChange={(e) => set('superFund', e.target.value)} placeholder="e.g. AustralianSuper" />
          </Field>
          <Field id="superMember" label="Member number">
            <Input id="superMember" value={w.superMember ?? ''} onChange={(e) => set('superMember', e.target.value)} placeholder="Member no." />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#1E293B]">Bank account</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="bsb" label="BSB (6 digits)">
            <Input id="bsb" value={w.bankBsb ?? ''} onChange={(e) => set('bankBsb', e.target.value)} placeholder="000000" />
          </Field>
          <Field id="acct" label="Account number">
            <Input id="acct" value={w.bankAccount ?? ''} onChange={(e) => set('bankAccount', e.target.value)} placeholder="Account no." />
          </Field>
        </div>
      </Card>

      <Card className="p-5" style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}>
        <h2 className="mb-2 text-sm font-semibold text-[#991B1B]">🚫 No cash work</h2>
        <p className="mb-3 text-sm text-[#64748B]">
          WorkArmy does not allow cash-in-hand work. All work is paid through proper payroll or invoicing
          with super and tax recorded — protecting your pay, super, insurance and legal rights.
        </p>
        <label className="flex items-center gap-2.5 text-sm font-medium text-[#1E293B]">
          <input
            type="checkbox"
            checked={w.noCashAck}
            onChange={(e) => set('noCashAck', e.target.checked)}
            style={{ accentColor: '#DC2626', width: 17, height: 17 }}
          />
          I understand and will not accept cash-only work
        </label>
      </Card>

      <Button loading={busy} onClick={save}>
        Save &amp; check readiness
      </Button>
    </div>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <span
        className={cn('grid h-6 w-6 place-items-center rounded-full', ok ? 'text-[#16A34A]' : 'text-[#94A3B8]')}
        style={{ backgroundColor: ok ? '#DCFCE7' : '#F1F5F9' }}
      >
        <Icon name={ok ? 'check' : 'lock'} size={13} />
      </span>
      <span className="text-sm text-[#1E293B]">{label}</span>
      <span className={cn('ml-auto text-xs font-medium', ok ? 'text-[#16A34A]' : 'text-[#94A3B8]')}>
        {ok ? 'Done' : 'Required'}
      </span>
    </li>
  );
}
