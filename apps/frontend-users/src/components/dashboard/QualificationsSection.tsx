'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { CredentialView, DocumentView } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon } from '@workarmy/ui';
import { api, fileDownloadUrl } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { FileUploadButton } from './FileUploadButton';

const TYPE_GROUPS: { label: string; types: string[] }[] = [
  { label: 'Qualifications', types: ['Certificate', 'Diploma', 'Degree', 'Trade qualification'] },
  {
    label: 'Licences',
    types: [
      'Driver licence',
      'Forklift licence',
      'White card',
      'Security licence',
      'Working with children check',
      'First aid certificate',
    ],
  },
  {
    label: 'Identity & checks',
    types: ['100-point ID', 'Right to work', 'Visa', 'Police check'],
  },
];

const inputCls =
  'h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]';

const statusTone: Record<string, string> = {
  NONE: 'bg-[#F1F5F9] text-[#64748B]',
  PENDING: 'bg-[#FEF9C3] text-[#854D0E]',
  APPROVED: 'bg-[#DCFCE7] text-[#166534]',
  REJECTED: 'bg-[#FEE2E2] text-[#991B1B]',
};
const statusLabel: Record<string, string> = {
  NONE: 'Not verified',
  PENDING: 'Verification pending',
  APPROVED: 'Verified',
  REJECTED: 'Rejected',
};

export function QualificationsSection() {
  const [creds, setCreds] = useState<CredentialView[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // add form
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [issuer, setIssuer] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [doc, setDoc] = useState<DocumentView | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setCreds(await api.credentials.list());
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
  }, []);

  function resetForm() {
    setType('');
    setIdentifier('');
    setIssuer('');
    setExpiresAt('');
    setDoc(null);
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!type) {
      setError('Choose a type.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.credentials.add({
        type,
        identifier: identifier || undefined,
        issuer: issuer || undefined,
        expiresAt: expiresAt || undefined,
        documentId: doc?.id,
      });
      resetForm();
      setShowForm(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function act(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const approved = creds.filter((c) => c.verificationStatus === 'APPROVED');

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl">Qualifications &amp; Compliance</h1>
          <p className="mt-0.5 text-sm text-[#64748B]">
            Add your certificates, licences and ID — then request verification. Kept separate from
            profile completeness.
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'Add credential'}</Button>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      {/* Verification badges */}
      <Card className="p-5">
        <p className="text-sm font-medium text-[#1E293B]">Verification badges</p>
        {approved.length === 0 ? (
          <p className="mt-2 text-sm text-[#64748B]">
            No verified credentials yet. Upload a document and request verification below.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {approved.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-medium text-[#166534]"
              >
                <Icon name="check" size={14} /> {c.type}
              </span>
            ))}
          </div>
        )}
      </Card>

      {showForm ? (
        <Card className="p-6">
          <form onSubmit={add} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="type" label="Type">
              <select id="type" value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                {TYPE_GROUPS.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.types.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field id="identifier" label="Number / reference">
              <input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className={inputCls} />
            </Field>
            <Field id="issuer" label="Issued by">
              <input id="issuer" value={issuer} onChange={(e) => setIssuer(e.target.value)} className={inputCls} />
            </Field>
            <Field id="expiresAt" label="Expiry date">
              <input id="expiresAt" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputCls} />
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-1.5 block text-sm font-medium text-[#1E293B]">Document</p>
              <div className="flex items-center gap-3">
                <FileUploadButton kind="CERTIFICATE" label={doc ? 'Replace file' : 'Upload file'} onUploaded={setDoc} />
                {doc ? <span className="text-sm text-[#16A34A]">{doc.fileName}</span> : <span className="text-sm text-[#94A3B8]">No file attached</span>}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" loading={saving}>Save credential</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {creds.length === 0 ? (
        <Card className="p-6 text-sm text-[#64748B]">No credentials yet. Add your first one above.</Card>
      ) : (
        <div className="space-y-3">
          {creds.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-[#1E293B]">{c.type}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone[c.verificationStatus]}`}>
                      {statusLabel[c.verificationStatus]}
                    </span>
                  </div>
                  <div className="mt-0.5 text-sm text-[#64748B]">
                    {[c.identifier, c.issuer, c.expiresAt ? `Expires ${c.expiresAt}` : null].filter(Boolean).join(' · ') || '—'}
                  </div>
                  {c.document ? (
                    <a
                      href={fileDownloadUrl(c.document.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1.5 text-sm"
                      style={{ color: 'var(--accent)' }}
                    >
                      <Icon name="file" size={14} /> {c.document.fileName}
                    </a>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  {c.verificationStatus === 'NONE' || c.verificationStatus === 'REJECTED' ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={busy === c.id}
                      onClick={() => act(c.id, () => api.credentials.requestVerification({ credentialId: c.id }))}
                    >
                      Request verification
                    </Button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => act(c.id, () => api.credentials.remove(c.id))}
                    className="text-sm text-[#DC2626] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
