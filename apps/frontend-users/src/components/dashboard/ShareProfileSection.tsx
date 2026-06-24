'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { CredentialView, PersonDetail, ResumeView } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { WorkerIdCard } from './WorkerIdCard';

export function ShareProfileSection() {
  const [me, setMe] = useState<PersonDetail | null>(null);
  const [resume, setResume] = useState<ResumeView | null>(null);
  const [creds, setCreds] = useState<CredentialView[]>([]);
  const [qr, setQr] = useState('');
  const [origin, setOrigin] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const [employer, setEmployer] = useState({ name: '', email: '' });

  useEffect(() => {
    setOrigin(window.location.origin);
    let active = true;
    (async () => {
      try {
        const [m, r, c] = await Promise.all([
          api.persons.getMe(),
          api.resume.getMe(),
          api.credentials.list(),
        ]);
        if (!active) return;
        setMe(m);
        setResume(r);
        setCreds(c);
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

  const shareUrl = resume ? `${origin}/r/${resume.shareToken}` : '';

  useEffect(() => {
    if (!shareUrl) return;
    QRCode.toDataURL(shareUrl, { width: 200, margin: 1 })
      .then(setQr)
      .catch(() => setQr(''));
  }, [shareUrl]);

  if (loading || !me) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  const name = `${me.firstName ?? ''} ${me.lastName ?? ''}`.trim() || 'WorkArmy member';
  const initials = `${me.firstName?.[0] ?? ''}${me.lastName?.[0] ?? ''}`.toUpperCase() || 'WA';
  const approved = creds.filter((c) => c.verificationStatus === 'APPROVED');
  const isPublic = resume?.isPublic ?? false;

  async function makePublic() {
    setError(null);
    setBusy(true);
    try {
      const r = await api.resume.setShare(true);
      setResume(r);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable
    }
  }

  function sendToEmployer() {
    const subject = encodeURIComponent(`${name} — WorkArmy profile`);
    const body = encodeURIComponent(
      `Hi ${employer.name || 'there'},\n\n` +
        `Here is my WorkArmy worker profile and verified credentials:\n${shareUrl}\n\n` +
        `Worker ID: ${me?.waId}\n\nKind regards,\n${name}`,
    );
    window.location.href = `mailto:${encodeURIComponent(employer.email)}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Share with Employers</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">
          Send employers a link to your verified profile, resume and credentials.
        </p>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Public link + QR */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#1E293B]">Your public profile link</h2>
          {isPublic ? (
            <>
              <div className="mt-3 flex items-center gap-2">
                <Input readOnly value={shareUrl} className="font-mono text-xs" />
                <Button type="button" variant="secondary" onClick={copyLink}>
                  <Icon name={copied ? 'check' : 'copy'} size={16} />
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="mt-4 flex flex-col items-center gap-3">
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qr} alt="Profile QR" className="h-40 w-40 rounded-lg border border-[#E5E7EB]" />
                ) : null}
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium"
                  style={{ color: 'var(--accent)' }}
                >
                  Preview public profile ↗
                </a>
              </div>
            </>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-[#E5E7EB] p-5 text-center">
              <p className="text-sm text-[#64748B]">
                Your profile link is private. Turn it on to share it with employers.
              </p>
              <div className="mt-3">
                <Button type="button" onClick={makePublic} loading={busy}>
                  Enable public profile
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Send to employer */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#1E293B]">Send to an employer</h2>
          <p className="mt-0.5 text-sm text-[#64748B]">
            We&apos;ll open your email with a ready-to-send message and your link.
          </p>
          <div className="mt-4 space-y-3">
            <Field id="empName" label="Employer / contact name">
              <Input
                id="empName"
                value={employer.name}
                onChange={(e) => setEmployer((v) => ({ ...v, name: e.target.value }))}
                placeholder="e.g. Jane at Acme Farms"
              />
            </Field>
            <Field id="empEmail" label="Employer email">
              <Input
                id="empEmail"
                type="email"
                value={employer.email}
                onChange={(e) => setEmployer((v) => ({ ...v, email: e.target.value }))}
                placeholder="jane@acme.com.au"
              />
            </Field>
            <Button
              type="button"
              fullWidth
              onClick={sendToEmployer}
              disabled={!isPublic || !employer.email}
            >
              <Icon name="send" size={16} /> Send my profile
            </Button>
            {!isPublic ? (
              <p className="text-xs text-[#94A3B8]">Enable your public profile first.</p>
            ) : null}
          </div>
        </Card>
      </div>

      {/* What employers see */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-[#1E293B]">What employers see</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <WorkerIdCard
            name={name}
            waId={me.waId}
            initials={initials}
            photoId={me.profile?.photoDocumentId ?? null}
            badges={approved.map((c) => c.type)}
          />
          <Card className="p-5">
            <dl className="space-y-2 text-sm">
              <Row label="Headline" value={me.profile?.headline ?? '—'} />
              <Row label="Skills" value={me.profile?.skills ?? '—'} />
              <Row label="Work experience" value={`${me.experiences.length} role(s)`} />
              <Row label="Verified credentials" value={`${approved.length} verified`} />
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[#64748B]">{label}</dt>
      <dd className="truncate text-right font-medium text-[#1E293B]">{value}</dd>
    </div>
  );
}
