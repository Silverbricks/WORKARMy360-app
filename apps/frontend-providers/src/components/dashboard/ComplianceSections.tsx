'use client';

import { type FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { CredentialView, VerificationView } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

type Tab = 'hub' | 'verify' | 'lhl' | 'ohs';
const TABS: { key: Tab; label: string; presetType?: string }[] = [
  { key: 'hub', label: 'Compliance Hub' },
  { key: 'verify', label: 'Verification' },
  { key: 'lhl', label: 'Labour Hire Licence', presetType: 'Labour Hire Licence' },
  { key: 'ohs', label: 'OH&S & Inductions', presetType: 'OH&S Induction' },
];

const vTone: Record<string, string> = {
  APPROVED: 'bg-[#DCFCE7] text-[#166534]',
  PENDING: 'bg-[#FEF3C7] text-[#92400E]',
  REJECTED: 'bg-[#FEE2E2] text-[#991B1B]',
  NONE: 'bg-[#F1F5F9] text-[#64748B]',
};

function expiringSoon(iso: string | null): boolean {
  if (!iso) return false;
  const days = (new Date(iso).getTime() - Date.now()) / 86400000;
  return days >= 0 && days <= 30;
}

export function ComplianceSection() {
  const tabParam = (useSearchParams().get('tab') as Tab) || 'hub';
  const tab: Tab = TABS.some((t) => t.key === tabParam) ? tabParam : 'hub';
  const preset = TABS.find((t) => t.key === tab)?.presetType;

  const [creds, setCreds] = useState<CredentialView[]>([]);
  const [verifs, setVerifs] = useState<VerificationView[]>([]);
  const [f, setF] = useState({ type: '', identifier: '', issuer: '', expiresAt: '' });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [c, v] = await Promise.all([api.business.compliance.credentials(), api.business.compliance.verifications()]);
    setCreds(c);
    setVerifs(v);
  }
  useEffect(() => {
    load().catch((e) => setError(errorMessage(e)));
  }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    const type = preset || f.type;
    if (!type.trim()) return setError('Enter a type.');
    try {
      await api.business.compliance.addCredential({ type, identifier: f.identifier || undefined, issuer: f.issuer || undefined, expiresAt: f.expiresAt || undefined });
      setF({ type: '', identifier: '', issuer: '', expiresAt: '' });
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    }
  }
  async function remove(id: string) { try { await api.business.compliance.removeCredential(id); await load(); } catch (e) { setError(errorMessage(e)); } }
  async function request(credentialId: string) { try { await api.business.compliance.requestVerification({ credentialId }); await load(); } catch (e) { setError(errorMessage(e)); } }

  const shown = preset ? creds.filter((c) => c.type === preset) : creds;
  const expiring = creds.filter((c) => expiringSoon(c.expiresAt)).length;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Compliance</h1>
      <div className="flex flex-wrap gap-1 border-b border-[#E5E7EB]">
        {TABS.map((t) => (
          <Link key={t.key} href={t.key === 'hub' ? '/dashboard/compliance' : `/dashboard/compliance?tab=${t.key}`}
            className={cn('border-b-2 px-3.5 py-2 text-sm font-medium', tab === t.key ? '' : 'border-transparent text-[#94A3B8]')}
            style={tab === t.key ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}>
            {t.label}
          </Link>
        ))}
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}

      {tab === 'hub' ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5"><p className="text-2xl font-semibold text-[#1E293B]">{creds.length}</p><p className="mt-1 text-xs text-[#64748B]">Credentials on file</p></Card>
          <Card className="p-5"><p className="text-2xl font-semibold text-[#1E293B]">{creds.filter((c) => c.verificationStatus === 'APPROVED').length}</p><p className="mt-1 text-xs text-[#64748B]">Verified</p></Card>
          <Card className="p-5"><p className="text-2xl font-semibold text-[#92400E]">{expiring}</p><p className="mt-1 text-xs text-[#64748B]">Expiring ≤30 days</p></Card>
        </div>
      ) : null}

      {tab !== 'verify' ? (
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-[#1E293B]">Add {preset || 'credential'}</p>
          <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto] sm:items-end">
            {!preset ? <Field id="cType" label="Type"><Input id="cType" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} placeholder="Insurance, LHL, ABN…" /></Field> : <div className="hidden sm:block" />}
            <Field id="cId" label="Identifier"><Input id="cId" value={f.identifier} onChange={(e) => setF({ ...f, identifier: e.target.value })} placeholder="Number" /></Field>
            <Field id="cIss" label="Issuer"><Input id="cIss" value={f.issuer} onChange={(e) => setF({ ...f, issuer: e.target.value })} /></Field>
            <Field id="cExp" label="Expires"><Input id="cExp" type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></Field>
            <Button type="submit">+ Add</Button>
          </form>
        </Card>
      ) : null}

      <Card className="p-4">
        <p className="mb-2 text-sm font-semibold text-[#1E293B]">{tab === 'verify' ? 'Verification requests' : 'Records'}</p>
        {tab === 'verify' ? (
          <>
            {creds.length === 0 ? <p className="py-4 text-center text-sm text-[#94A3B8]">Add a credential first, then request verification.</p> : (
              <ul className="divide-y divide-[#E5E7EB]">
                {creds.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-3 text-sm">
                    <div className="min-w-0 flex-1"><p className="font-medium text-[#1E293B]">{c.type}</p><p className="text-xs text-[#64748B]">{c.identifier || '—'}</p></div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${vTone[c.verificationStatus]}`}>{c.verificationStatus}</span>
                    {c.verificationStatus === 'NONE' ? <Button size="sm" variant="ghost" onClick={() => request(c.id)}>Request</Button> : null}
                  </li>
                ))}
              </ul>
            )}
            {verifs.length > 0 ? (
              <ul className="mt-3 divide-y divide-[#F1F5F9] border-t border-[#E5E7EB] pt-2">
                {verifs.map((v) => (
                  <li key={v.id} className="flex items-center gap-2 py-2 text-xs text-[#64748B]">
                    <Icon name="shield" size={14} /> {v.credentialType || 'Credential'} · <span className={`rounded-full px-2 py-0.5 font-medium ${vTone[v.status]}`}>{v.status}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : shown.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#94A3B8]">No records yet.</p>
        ) : (
          <ul className="divide-y divide-[#E5E7EB]">
            {shown.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3 text-sm">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F1F5F9]"><Icon name="shield" size={16} /></span>
                <div className="min-w-0 flex-1"><p className="font-medium text-[#1E293B]">{c.type}</p><p className="text-xs text-[#64748B]">{[c.identifier, c.issuer].filter(Boolean).join(' · ') || '—'}{c.expiresAt ? ` · expires ${c.expiresAt.slice(0, 10)}` : ''}</p></div>
                {expiringSoon(c.expiresAt) ? <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-xs font-medium text-[#92400E]">Expiring</span> : null}
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${vTone[c.verificationStatus]}`}>{c.verificationStatus}</span>
                <button type="button" onClick={() => remove(c.id)} className="text-[#94A3B8] hover:text-[#991B1B]" aria-label="Remove"><Icon name="trash" size={16} /></button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export function DocumentsSection() {
  const [creds, setCreds] = useState<CredentialView[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api.business.compliance.credentials().then(setCreds).catch((e) => setError(errorMessage(e)));
  }, []);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Documents</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#1E293B]">Compliance documents &amp; credentials</p>
          <Link href="/dashboard/compliance" className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Manage in Compliance</Link>
        </div>
        {creds.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#94A3B8]">No documents yet — add licences, insurance &amp; certificates in Compliance.</p>
        ) : (
          <ul className="divide-y divide-[#E5E7EB]">
            {creds.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3 text-sm">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F1F5F9]"><Icon name="file" size={16} /></span>
                <div className="min-w-0 flex-1"><p className="font-medium text-[#1E293B]">{c.type}</p><p className="text-xs text-[#64748B]">{c.identifier || '—'}</p></div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
