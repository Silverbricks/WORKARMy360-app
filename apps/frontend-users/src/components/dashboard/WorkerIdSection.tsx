'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { CredentialView, DocumentView, PersonDetail, ResumeView } from '@workarmy/types';
import { Alert, Card } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { FileUploadButton } from './FileUploadButton';
import { WorkerIdCard } from './WorkerIdCard';

export function WorkerIdSection() {
  const [me, setMe] = useState<PersonDetail | null>(null);
  const [creds, setCreds] = useState<CredentialView[]>([]);
  const [resume, setResume] = useState<ResumeView | null>(null);
  const [qr, setQr] = useState<string>('');
  const [origin, setOrigin] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadMe() {
    setMe(await api.persons.getMe());
  }

  useEffect(() => {
    setOrigin(window.location.origin);
    let active = true;
    (async () => {
      try {
        const [, c, r] = await Promise.all([loadMe(), api.credentials.list(), api.resume.getMe()]);
        if (!active) return;
        setCreds(c);
        setResume(r);
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

  async function onPhoto(doc: DocumentView) {
    setError(null);
    try {
      await api.persons.setPhoto(doc.id);
      await loadMe();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (loading || !me) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  const name = `${me.firstName ?? ''} ${me.lastName ?? ''}`.trim() || 'WorkArmy member';
  const initials = `${me.firstName?.[0] ?? ''}${me.lastName?.[0] ?? ''}`.toUpperCase() || 'WA';
  const photoId = me.profile?.photoDocumentId ?? null;
  const approved = creds.filter((c) => c.verificationStatus === 'APPROVED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Digital Worker Identity</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">Your portable, verifiable identity on site and online.</p>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="grid gap-6 md:grid-cols-2">
        {/* ID card */}
        <WorkerIdCard
          name={name}
          waId={me.waId}
          initials={initials}
          photoId={photoId}
          badges={approved.map((c) => c.type)}
          footer={
            <FileUploadButton
              kind="OTHER"
              label={photoId ? 'Change photo' : 'Upload photo'}
              onUploaded={onPhoto}
            />
          }
        />

        {/* QR Worker Pass */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#1E293B]">QR Worker Pass</h2>
          <p className="mt-0.5 text-sm text-[#64748B]">Scan to view your verified profile and resume.</p>
          <div className="mt-4 flex flex-col items-center gap-3">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="Worker QR pass" className="h-44 w-44 rounded-lg border border-[#E5E7EB]" />
            ) : (
              <div className="grid h-44 w-44 place-items-center rounded-lg border border-dashed border-[#E5E7EB] text-sm text-[#94A3B8]">QR</div>
            )}
            {resume?.isPublic ? (
              <a href={shareUrl} target="_blank" rel="noreferrer" className="break-all text-center text-sm" style={{ color: 'var(--accent)' }}>
                {shareUrl}
              </a>
            ) : (
              <p className="text-center text-sm text-[#64748B]">
                Make your resume public in the <span className="font-medium">Resume Centre</span> so this pass is scannable.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
