'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { JobListing, MyApplication } from '@workarmy/types';
import { Alert, Button, Card, Icon, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { useTabParam } from '@/lib/use-tab-param';
import { useMe } from './DashboardShell';

type Tab = 'find' | 'saved' | 'applied' | 'interviews';
const TABS = ['find', 'saved', 'applied', 'interviews'] as const;

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
  const me = useMe();
  const profileComplete = me?.person?.profileComplete ?? false;
  const [tab, setTab] = useTabParam<Tab>(TABS, 'find');
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [savedJobs, setSavedJobs] = useState<JobListing[]>([]);
  const [apps, setApps] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadJobs() {
    const res = await api.jobs.browse({ pageSize: 50 });
    setJobs(res.items);
  }
  async function loadSaved() {
    setSavedJobs(await api.jobs.saved());
  }
  async function loadApps() {
    setApps(await api.applications.mine());
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await Promise.all([loadJobs(), loadSaved(), loadApps()]);
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
      await Promise.all([loadJobs(), loadSaved(), loadApps()]);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function toggleSave(job: JobListing) {
    setError(null);
    try {
      if (job.saved) await api.jobs.unsave(job.id);
      else await api.jobs.save(job.id);
      await Promise.all([loadJobs(), loadSaved()]);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const interviews = apps.filter((a) => a.stage === 'INTERVIEW');

  function jobCard(job: JobListing) {
    return (
      <Card key={job.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <div className="font-medium text-[#1E293B]">{job.title}</div>
          <div className="mt-0.5 text-sm text-[#64748B]">
            {[job.org.name, job.location, job.state, payLabel(job)].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleSave(job)}
            aria-label={job.saved ? 'Remove from saved' : 'Save job'}
            className="grid h-9 w-9 place-items-center rounded-lg border border-[#E5E7EB] hover:bg-[#F8FAFC]"
            style={job.saved ? { color: 'var(--accent)' } : { color: '#94A3B8' }}
          >
            <Icon name="star" size={18} fill={job.saved ? 'currentColor' : 'none'} />
          </button>
          {!profileComplete ? (
            <Link href="/dashboard/profile">
              <Button size="sm" variant="secondary">
                <Icon name="lock" size={14} /> Verify to apply
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              disabled={job.applied || busy === job.id}
              loading={busy === job.id}
              onClick={() => apply(job.id)}
            >
              {job.applied ? 'Applied' : 'Apply'}
            </Button>
          )}
        </div>
      </Card>
    );
  }

  function appCard(a: MyApplication) {
    return (
      <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <div className="font-medium text-[#1E293B]">{a.job.title}</div>
          <div className="mt-0.5 text-sm text-[#64748B]">
            {[a.job.org.name, a.job.location, a.job.state].filter(Boolean).join(' · ')}
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stageTone[a.stage]}`}>
          {a.stage}
        </span>
      </Card>
    );
  }

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'find', label: 'Find Jobs', count: jobs.length },
    { key: 'saved', label: 'Saved', count: savedJobs.length },
    { key: 'applied', label: 'Applied', count: apps.length },
    { key: 'interviews', label: 'Interviews', count: interviews.length },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Jobs &amp; Applications</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}

      {!profileComplete ? (
        <Card
          className="flex flex-wrap items-center justify-between gap-3 p-4"
          style={{ borderColor: 'color-mix(in srgb, var(--accent) 35%, white)' }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-[color:var(--accent)]">
              <Icon name="lock" size={18} />
            </span>
            <p className="text-sm text-[#1E293B]">
              Browse freely — but you&apos;ll need a verified profile &amp; 100-point ID to apply.
            </p>
          </div>
          <Link href="/dashboard/profile">
            <Button size="sm">Verify my profile →</Button>
          </Link>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm',
              tab === t.key ? 'text-white' : 'bg-[#F1F5F9] text-[#64748B]',
            )}
            style={tab === t.key ? { backgroundColor: 'var(--accent)' } : undefined}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tab === 'find' &&
        (jobs.length === 0 ? (
          <Card className="p-6 text-sm text-[#64748B]">No published jobs yet. Check back soon.</Card>
        ) : (
          <div className="space-y-3">{jobs.map(jobCard)}</div>
        ))}

      {tab === 'saved' &&
        (savedJobs.length === 0 ? (
          <Card className="p-6 text-sm text-[#64748B]">No saved jobs yet. Tap the ☆ on a job to save it.</Card>
        ) : (
          <div className="space-y-3">{savedJobs.map(jobCard)}</div>
        ))}

      {tab === 'applied' &&
        (apps.length === 0 ? (
          <Card className="p-6 text-sm text-[#64748B]">You haven’t applied to any jobs yet.</Card>
        ) : (
          <div className="space-y-3">{apps.map(appCard)}</div>
        ))}

      {tab === 'interviews' &&
        (interviews.length === 0 ? (
          <Card className="p-6 text-sm text-[#64748B]">No interviews scheduled yet.</Card>
        ) : (
          <div className="space-y-3">{interviews.map(appCard)}</div>
        ))}
    </div>
  );
}
