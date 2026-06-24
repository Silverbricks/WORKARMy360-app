'use client';

import { useEffect, useState } from 'react';
import type { PublicResume } from '@workarmy/types';
import { Button, Card, Icon } from '@workarmy/ui';
import { api, fileDownloadUrl } from '@/lib/api';

function splitCsv(v: string | null): string[] {
  return v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

export function PublicResumeView({ token }: { token: string }) {
  const [data, setData] = useState<PublicResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    api.resume
      .public(token)
      .then((d) => active && setData(d))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  if (loading) return <div className="py-24 text-center text-[#64748B]">Loading…</div>;
  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-[#1E293B]">Resume not available</h1>
        <p className="mt-2 text-sm text-[#64748B]">This resume is private or the link is invalid.</p>
      </div>
    );
  }

  const name = `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() || 'WorkArmy member';
  const initials = `${data.firstName?.[0] ?? ''}${data.lastName?.[0] ?? ''}`.toUpperCase() || 'WA';
  const skills = splitCsv(data.skills);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          {data.photoDocumentId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fileDownloadUrl(data.photoDocumentId)} alt={name} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <span className="grid h-20 w-20 place-items-center rounded-full text-xl font-semibold text-white" style={{ backgroundColor: 'var(--accent)' }}>
              {initials}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl text-[#1E293B]">{name}</h1>
            {data.headline ? <p className="text-sm text-[#64748B]">{data.headline}</p> : null}
            <p className="mt-1 font-mono text-xs text-[#94A3B8]">{data.waId}</p>
          </div>
          {data.resumeDocumentId ? (
            <a href={fileDownloadUrl(data.resumeDocumentId)} target="_blank" rel="noreferrer">
              <Button size="sm" variant="secondary">
                <span className="inline-flex items-center gap-1.5"><Icon name="download" size={15} /> Resume</span>
              </Button>
            </a>
          ) : null}
        </div>
      </Card>

      {data.summary ? (
        <Card className="p-6">
          <h2 className="mb-2 text-lg font-semibold text-[#1E293B]">About</h2>
          <p className="whitespace-pre-wrap text-sm text-[#475569]">{data.summary}</p>
        </Card>
      ) : null}

      {data.credentials.length > 0 ? (
        <Card className="p-6">
          <h2 className="mb-3 text-lg font-semibold text-[#1E293B]">Credentials</h2>
          <div className="flex flex-wrap gap-2">
            {data.credentials.map((c, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${c.verified ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#F1F5F9] text-[#64748B]'}`}
              >
                {c.verified ? <Icon name="check" size={13} /> : null}
                {c.type}
              </span>
            ))}
          </div>
        </Card>
      ) : null}

      {skills.length > 0 ? (
        <Card className="p-6">
          <h2 className="mb-3 text-lg font-semibold text-[#1E293B]">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s} className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs text-[#1E293B]">{s}</span>
            ))}
          </div>
        </Card>
      ) : null}

      {data.experiences.length > 0 ? (
        <Card className="p-6">
          <h2 className="mb-3 text-lg font-semibold text-[#1E293B]">Experience</h2>
          <ul className="space-y-4">
            {data.experiences.map((x) => (
              <li key={x.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-[#1E293B]">{x.position || 'Role'}</span>
                  <span className="text-sm text-[#64748B]">· {x.employer}</span>
                  {x.current ? <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs text-[#166534]">Current</span> : null}
                </div>
                <div className="mt-0.5 text-sm text-[#64748B]">
                  {[x.employmentType, x.location, [x.startDate, x.current ? 'Present' : x.endDate].filter(Boolean).join(' – ')].filter(Boolean).join(' · ')}
                </div>
                {x.summary ? <p className="mt-1 text-sm text-[#475569]">{x.summary}</p> : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <p className="text-center text-xs text-[#94A3B8]">Powered by WorkArmy</p>
    </div>
  );
}
