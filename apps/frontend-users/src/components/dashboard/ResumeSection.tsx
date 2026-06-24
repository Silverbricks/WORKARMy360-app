'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { CoverLetter, DocumentView, ResumeView } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input } from '@workarmy/ui';
import { api, fileDownloadUrl } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { FileUploadButton } from './FileUploadButton';

const areaCls =
  'min-h-[110px] w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]';

export function ResumeSection() {
  const [resume, setResume] = useState<ResumeView | null>(null);
  const [portfolio, setPortfolio] = useState<DocumentView[]>([]);
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [covers, setCovers] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');

  function apply(r: ResumeView) {
    setResume(r);
    setHeadline(r.headline ?? '');
    setSummary(r.summary ?? '');
    setCovers(r.coverLetters ?? []);
  }

  async function loadPortfolio() {
    setPortfolio(await api.files.list());
  }

  useEffect(() => {
    setOrigin(window.location.origin);
    let active = true;
    (async () => {
      try {
        const [r] = await Promise.all([api.resume.getMe(), loadPortfolio()]);
        if (active) apply(r);
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

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const r = await api.resume.update({ headline, summary, coverLetters: covers });
      apply(r);
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function onResumeFile(doc: DocumentView) {
    setError(null);
    try {
      apply(await api.resume.update({ documentId: doc.id }));
      await loadPortfolio();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function detachResume() {
    setError(null);
    try {
      apply(await api.resume.update({ documentId: null }));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function toggleShare() {
    if (!resume) return;
    setError(null);
    try {
      apply(await api.resume.setShare(!resume.isPublic));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function addPortfolio(doc: DocumentView) {
    setPortfolio((p) => [doc, ...p.filter((x) => x.id !== doc.id)]);
  }
  async function removePortfolio(id: string) {
    setError(null);
    try {
      await api.files.remove(id);
      setPortfolio((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (loading || !resume) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  const shareUrl = `${origin}/r/${resume.shareToken}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Resume Centre</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">Build, upload and share your resume and portfolio.</p>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {saved ? <Alert tone="success">Resume saved.</Alert> : null}

      <form onSubmit={save} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#1E293B]">Resume details</h2>
          <Field id="headline" label="Headline">
            <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Experienced warehouse team leader" />
          </Field>
          <Field id="summary" label="Professional summary">
            <textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} className={areaCls} />
          </Field>

          <div>
            <p className="mb-1.5 text-sm font-medium text-[#1E293B]">Resume file</p>
            <div className="flex items-center gap-3">
              <FileUploadButton kind="OTHER" label={resume.document ? 'Replace resume' : 'Upload resume'} onUploaded={onResumeFile} />
              {resume.document ? (
                <>
                  <a href={fileDownloadUrl(resume.document.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm" style={{ color: 'var(--accent)' }}>
                    <Icon name="download" size={14} /> {resume.document.fileName}
                  </a>
                  <button type="button" onClick={detachResume} className="text-sm text-[#DC2626] hover:underline">Remove</button>
                </>
              ) : (
                <span className="text-sm text-[#94A3B8]">No file uploaded</span>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1E293B]">Cover letters</h2>
            <Button type="button" size="sm" variant="secondary" onClick={() => setCovers((c) => [...c, { title: '', body: '' }])}>
              Add cover letter
            </Button>
          </div>
          {covers.length === 0 ? (
            <p className="text-sm text-[#64748B]">No cover letters yet.</p>
          ) : (
            covers.map((c, i) => (
              <div key={i} className="rounded-lg border border-[#E5E7EB] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Input value={c.title} onChange={(e) => setCovers((arr) => arr.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))} placeholder="Title (e.g. General application)" />
                  <button type="button" onClick={() => setCovers((arr) => arr.filter((_, idx) => idx !== i))} className="shrink-0 text-sm text-[#DC2626] hover:underline">Remove</button>
                </div>
                <textarea value={c.body} onChange={(e) => setCovers((arr) => arr.map((x, idx) => (idx === i ? { ...x, body: e.target.value } : x)))} className={areaCls} placeholder="Cover letter text" />
              </div>
            ))
          )}
        </Card>

        <div className="flex items-center justify-end gap-3">
          {saved ? <span className="text-sm text-[#16A34A]">Saved</span> : null}
          <Button type="submit" loading={saving}>Save resume</Button>
        </div>
      </form>

      {/* Share */}
      <Card className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1E293B]">Public resume</h2>
          <Button type="button" size="sm" variant={resume.isPublic ? 'secondary' : 'primary'} onClick={toggleShare}>
            {resume.isPublic ? 'Make private' : 'Make public'}
          </Button>
        </div>
        {resume.isPublic ? (
          <div className="flex flex-wrap items-center gap-2">
            <a href={shareUrl} target="_blank" rel="noreferrer" className="break-all text-sm" style={{ color: 'var(--accent)' }}>{shareUrl}</a>
            <button type="button" onClick={() => navigator.clipboard?.writeText(shareUrl)} className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] px-2 py-1 text-xs text-[#64748B] hover:bg-[#F8FAFC]">
              <Icon name="share" size={13} /> Copy link
            </button>
          </div>
        ) : (
          <p className="text-sm text-[#64748B]">Your resume is private. Make it public to share a link and QR pass.</p>
        )}
      </Card>

      {/* Portfolio */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1E293B]">Digital portfolio</h2>
          <FileUploadButton kind="OTHER" label="Add to portfolio" onUploaded={addPortfolio} />
        </div>
        {portfolio.length === 0 ? (
          <p className="text-sm text-[#64748B]">No files yet. Upload photos, certificates or work samples.</p>
        ) : (
          <ul className="space-y-2">
            {portfolio.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] p-3">
                <a href={fileDownloadUrl(d.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 truncate text-sm" style={{ color: 'var(--accent)' }}>
                  <Icon name="file" size={14} /> {d.fileName}
                </a>
                <button type="button" onClick={() => removePortfolio(d.id)} className="shrink-0 text-sm text-[#DC2626] hover:underline">Remove</button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
