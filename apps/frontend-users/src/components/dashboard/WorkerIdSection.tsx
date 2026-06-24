'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { CredentialView, DocumentView, PersonDetail, ResumeView } from '@workarmy/types';
import { Alert, Card, Icon } from '@workarmy/ui';
import { api, fileDownloadUrl } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { FileUploadButton } from './FileUploadButton';

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
        <Card className="overflow-hidden p-0">
          <div className="px-5 py-3 text-sm font-semibold text-white" style={{ backgroundColor: 'var(--accent)' }}>
            WorkArmy Digital ID
          </div>
          <div className="flex items-center gap-4 p-5">
            {photoId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fileDownloadUrl(photoId)} alt={name} className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <span className="grid h-20 w-20 place-items-center rounded-full text-xl font-semibold text-white" style={{ backgroundColor: 'var(--accent)' }}>
                {initials}
              </span>
            )}
            <div className="min-w-0">
              <div className="text-lg font-semibold text-[#1E293B]">{name}</div>
              <div className="font-mono text-sm text-[#64748B]">{me.waId}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {approved.length === 0 ? (
                  <span className="text-xs text-[#94A3B8]">No verified badges yet</span>
                ) : (
                  approved.map((c) => (
                    <span key={c.id} className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-medium text-[#166534]">
                      <Icon name="check" size={12} /> {c.type}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-[#E5E7EB] p-4">
            <FileUploadButton kind="OTHER" label={photoId ? 'Change photo' : 'Upload photo'} onUploaded={onPhoto} />
          </div>
        </Card>

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
