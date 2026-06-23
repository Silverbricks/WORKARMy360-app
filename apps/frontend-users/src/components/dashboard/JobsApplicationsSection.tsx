'use client';

import { useEffect, useState } from 'react';
import type { JobListing, MyApplication } from '@workarmy/types';
import { Alert, Button, Card, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

const stageTone: Record<string, string> = {
  APPLIED: 'bg-[#EFF6FF] text-[#1E40AF]',
  SHORTLISTED: 'bg-[#FEF9C3] text-[#854D0E]',
  INTERVIEW: 'bg-[#F3E8FF] text-[#6B21A8]',
  OFFERED: 'bg-[#DCFCE7] text-[#166534]',
  HIRED: 'bg-[#DCFCE7] text-[#166534]',
  REJECTED: 'bg-[#FEE2E2] text-[#991B1B]',
  WITHDRAWN: 'bg-[#F1F5F9] text-[#64748B]',
};

function payLabel(j: JobListing): string {
  if (!j.payMin && !j.payMax) return '';
  const range = j.payMin && j.payMax ? `$${j.payMin}–$${j.payMax}` : `$${j.payMin ?? j.payMax}`;
  return j.payUnit ? `${range}/${j.payUnit}` : range;
}

export function JobsApplicationsSection() {
  const [tab, setTab] = useState<'find' | 'mine'>('find');
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [apps, setApps] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadJobs() {
    const res = await api.jobs.browse({ pageSize: 50 });
    setJobs(res.items);
  }
  async function loadApps() {
    setApps(await api.applications.mine());
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await Promise.all([loadJobs(), loadApps()]);
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

  async function apply(jobId: string) {
    setBusy(jobId);
    setError(null);
    try {
      await api.applications.apply(jobId);
      await Promise.all([loadJobs(), loadApps()]);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Jobs & Applications</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="flex gap-2">
        {(['find', 'mine'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm',
              tab === t ? 'text-white' : 'bg-[#F1F5F9] text-[#64748B]',
            )}
            style={tab === t ? { backgroundColor: 'var(--accent)' } : undefined}
          >
            {t === 'find' ? `Find Jobs (${jobs.length})` : `My Applications (${apps.length})`}
          </button>
        ))}
      </div>

      {tab === 'find' ? (
        jobs.length === 0 ? (
          <Card className="p-6 text-sm text-[#64748B]">No published jobs yet. Check back soon.</Card>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Card key={job.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <div className="font-medium text-[#1E293B]">{job.title}</div>
                  <div className="mt-0.5 text-sm text-[#64748B]">
                    {[job.org.name, job.location, job.state, payLabel(job)].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={job.applied || busy === job.id}
                  loading={busy === job.id}
                  onClick={() => apply(job.id)}
                >
                  {job.applied ? 'Applied' : 'Apply'}
                </Button>
              </Card>
            ))}
          </div>
        )
      ) : apps.length === 0 ? (
        <Card className="p-6 text-sm text-[#64748B]">You haven’t applied to any jobs yet.</Card>
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <div className="font-medium text-[#1E293B]">{a.job.title}</div>
                <div className="mt-0.5 text-sm text-[#64748B]">
                  {[a.job.org.name, a.job.location, a.job.state].filter(Boolean).join(' · ')}
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stageTone[a.stage]}`}>
                {a.stage}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
