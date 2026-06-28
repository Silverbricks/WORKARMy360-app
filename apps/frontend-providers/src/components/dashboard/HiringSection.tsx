'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  APPLICATION_STAGES,
  type Applicant,
  type ApplicationStage,
  type Job,
  type JobInput,
  type JobShareToggles,
} from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { useMe } from './DashboardShell';

type Tab = 'post' | 'open' | 'applicants' | 'interviews';
const TABS: { key: Tab; label: string }[] = [
  { key: 'post', label: 'Post a Job' },
  { key: 'open', label: 'Jobs & Shifts' },
  { key: 'applicants', label: 'Applicants' },
  { key: 'interviews', label: 'Shortlist & Interviews' },
];

const statusTone: Record<string, string> = {
  DRAFT: 'bg-[#F1F5F9] text-[#64748B]',
  PUBLISHED: 'bg-[#DCFCE7] text-[#166534]',
  CLOSED: 'bg-[#FEE2E2] text-[#991B1B]',
  ARCHIVED: 'bg-[#F1F5F9] text-[#64748B]',
};
const stageTone: Record<string, string> = {
  APPLIED: 'bg-[#E0E7FF] text-[#3730A3]',
  SHORTLISTED: 'bg-[#FEF3C7] text-[#92400E]',
  INTERVIEW: 'bg-[#DBEAFE] text-[#1E40AF]',
  OFFERED: 'bg-[#E9D5FF] text-[#6B21A8]',
  HIRED: 'bg-[#DCFCE7] text-[#166534]',
  REJECTED: 'bg-[#FEE2E2] text-[#991B1B]',
  WITHDRAWN: 'bg-[#F1F5F9] text-[#64748B]',
};

const EMPTY_FORM: JobInput & { shareToggles: JobShareToggles } = {
  title: '',
  description: '',
  employmentType: '',
  location: '',
  suburb: '',
  state: '',
  payUnit: 'hour',
  positions: 1,
  urgent: false,
  shareToggles: { inApp: true, social: false, onSite: false, topPriority: false },
};

export function HiringSection() {
  const me = useMe();
  const verified = me.organisation.verificationStatus === 'APPROVED';
  const tabParam = (useSearchParams().get('tab') as Tab) || 'open';
  const tab: Tab = TABS.some((t) => t.key === tabParam) ? tabParam : 'open';

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setJobs(await api.jobs.mine());
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.jobs.mine();
        if (active) setJobs(data);
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

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Hiring</h1>

      <div className="flex flex-wrap gap-1 border-b border-[#E5E7EB]">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/dashboard/jobs?tab=${t.key}`}
            className={cn(
              'border-b-2 px-4 py-2 text-sm font-medium transition',
              tab === t.key
                ? 'text-[#1E293B]'
                : 'border-transparent text-[#94A3B8] hover:text-[#1E293B]',
            )}
            style={tab === t.key ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      {!verified ? (
        <Card className="flex flex-wrap items-center gap-3 border-[#FCD34D] bg-[#FFFBEB] p-4">
          <Icon name="shield" size={20} className="text-[#92400E]" />
          <p className="flex-1 text-sm text-[#92400E]">
            Your business is pending verification. You can draft jobs now — publishing and hiring unlock once
            verified.
          </p>
        </Card>
      ) : null}

      {tab === 'post' ? <PostJob verified={verified} onCreated={refresh} /> : null}
      {tab === 'open' ? <JobsList jobs={jobs} verified={verified} onChange={refresh} setError={setError} /> : null}
      {tab === 'applicants' ? <Applicants jobs={jobs} stages={['APPLIED', 'OFFERED']} title="Applicants & hiring" /> : null}
      {tab === 'interviews' ? (
        <Applicants jobs={jobs} stages={['SHORTLISTED', 'INTERVIEW']} title="Shortlist & interviews" />
      ) : null}
    </div>
  );
}

function PostJob({ verified, onCreated }: { verified: boolean; onCreated: () => Promise<void> }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function setShare(k: keyof JobShareToggles, v: boolean) {
    setForm((f) => ({ ...f, shareToggles: { ...f.shareToggles, [k]: v } }));
  }

  async function submit(e: FormEvent, publish: boolean) {
    e.preventDefault();
    if (!form.title.trim()) {
      setErr('Enter a job title.');
      return;
    }
    setBusy(true);
    setErr(null);
    setOk(null);
    try {
      const job = await api.jobs.create({ ...form, positions: Number(form.positions) || 1 });
      if (publish) await api.jobs.publish(job.id);
      setForm(EMPTY_FORM);
      setOk(publish ? 'Job published.' : 'Saved as draft.');
      await onCreated();
    } catch (e2) {
      setErr(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  }

  const shareRows: { key: keyof JobShareToggles; label: string; desc: string }[] = [
    { key: 'inApp', label: 'To staff in the app', desc: 'Notify your workers & on-call list' },
    { key: 'social', label: 'Social media', desc: 'Facebook, Instagram, LinkedIn' },
    { key: 'onSite', label: 'Business page / on-site', desc: 'Your WorkArmy page and on-site board' },
    { key: 'topPriority', label: 'Top priority placement', desc: 'Boost to the top of worker feeds' },
  ];

  return (
    <form onSubmit={(e) => submit(e, false)} className="space-y-4">
      {err ? <Alert tone="error">{err}</Alert> : null}
      {ok ? <Alert tone="success">{ok}</Alert> : null}

      <Card className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field id="title" label="Job title">
              <Input id="title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Fruit Picker" />
            </Field>
          </div>
          <Field id="positions" label="Positions needed">
            <Input id="positions" type="number" value={String(form.positions ?? 1)} onChange={(e) => set('positions', Number(e.target.value) as never)} />
          </Field>
          <Field id="employmentType" label="Engagement">
            <Input id="employmentType" placeholder="casual / seasonal / full-time" value={form.employmentType ?? ''} onChange={(e) => set('employmentType', e.target.value)} />
          </Field>
          <Field id="location" label="Site / location">
            <Input id="location" value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Cranbourne" />
          </Field>
          <Field id="state" label="State">
            <Input id="state" placeholder="VIC / NSW / QLD" value={form.state ?? ''} onChange={(e) => set('state', e.target.value)} />
          </Field>
          <Field id="payUnit" label="Pay unit">
            <Input id="payUnit" placeholder="hour / day / week" value={form.payUnit ?? ''} onChange={(e) => set('payUnit', e.target.value)} />
          </Field>
          <Field id="payMin" label="Pay rate ($)">
            <Input id="payMin" type="number" value={form.payMin ? String(form.payMin) : ''} onChange={(e) => set('payMin', Number(e.target.value) as never)} placeholder="28" />
          </Field>
          <div className="sm:col-span-2">
            <Field id="description" label="Description & requirements">
              <Input id="description" value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} placeholder="Duties, certifications, shift notes…" />
            </Field>
          </div>
        </div>

        <label className="mt-3 flex items-center gap-2.5 text-sm text-[#1E293B]">
          <input type="checkbox" checked={!!form.urgent} onChange={(e) => set('urgent', e.target.checked)} />
          <Icon name="zap" size={16} style={{ color: 'var(--accent)' }} />
          Mark as urgent — push to nearby available workers
        </label>
      </Card>

      <Card className="p-6">
        <p className="mb-3 text-sm font-semibold text-[#1E293B]">Where to share</p>
        <div className="space-y-1">
          {shareRows.map((r) => (
            <label key={r.key} className="flex items-center gap-3 border-b border-[#F1F5F9] py-2.5 last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1E293B]">{r.label}</p>
                <p className="text-xs text-[#94A3B8]">{r.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={!!form.shareToggles[r.key]}
                onChange={(e) => setShare(r.key, e.target.checked)}
              />
            </label>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="button" loading={busy} onClick={(e) => submit(e as unknown as FormEvent, true)} disabled={!verified}>
          Publish
        </Button>
        <Button type="submit" variant="secondary" loading={busy}>
          Save draft
        </Button>
        {!verified ? <span className="self-center text-xs text-[#94A3B8]">Publishing unlocks once verified</span> : null}
      </div>
    </form>
  );
}

function JobsList({
  jobs,
  verified,
  onChange,
  setError,
}: {
  jobs: Job[];
  verified: boolean;
  onChange: () => Promise<void>;
  setError: (s: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await onChange();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (jobs.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-[#64748B]">
        No jobs yet.{' '}
        <Link href="/dashboard/jobs?tab=post" style={{ color: 'var(--accent)' }}>
          Post a job
        </Link>{' '}
        to start hiring.
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <Card key={job.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#1E293B]">{job.title}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${statusTone[job.status]}`}>{job.status}</span>
              {job.urgent ? (
                <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-xs font-semibold text-[#92400E]">
                  Urgent
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 text-sm text-[#64748B]">
              {[job.location, job.state, job.employmentType].filter(Boolean).join(' · ') || '—'}
              {job.positions ? ` · ${job.positions} position${job.positions > 1 ? 's' : ''}` : ''}
            </div>
          </div>
          <div className="flex gap-2">
            {job.status === 'DRAFT' ? (
              <Button size="sm" disabled={busy || !verified} onClick={() => act(() => api.jobs.publish(job.id))}>
                Publish
              </Button>
            ) : null}
            {job.status === 'PUBLISHED' ? (
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => act(() => api.jobs.close(job.id))}>
                Close
              </Button>
            ) : null}
            <Link href="/dashboard/jobs?tab=applicants">
              <Button size="sm" variant="ghost">
                Applicants
              </Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Applicants({ jobs, stages, title }: { jobs: Job[]; stages: ApplicationStage[]; title: string }) {
  const [rows, setRows] = useState<{ app: Applicant; jobTitle: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const relevantJobs = useMemo(() => jobs.filter((j) => j.status !== 'DRAFT'), [jobs]);
  // Stable signature of the relevant jobs so applicants refetch when the set OR a
  // title changes — not just when the count happens to differ.
  const jobsKey = relevantJobs.map((j) => `${j.id}:${j.title}`).join('|');

  async function load() {
    setError(null);
    try {
      const lists = await Promise.all(
        relevantJobs.map(async (j) => {
          const applicants = await api.applications.forJob(j.id);
          return applicants.map((app) => ({ app, jobTitle: j.title }));
        }),
      );
      setRows(lists.flat());
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobsKey]);

  async function setStage(id: string, toStage: ApplicationStage) {
    try {
      await api.applications.changeStage(id, { toStage });
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const filtered = (rows ?? []).filter((r) => stages.includes(r.app.stage));

  return (
    <Card className="p-6">
      <h2 className="mb-3 text-lg font-semibold text-[#1E293B]">{title}</h2>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {rows === null ? (
        <p className="text-sm text-[#64748B]">Loading applicants…</p>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#94A3B8]">
          {relevantJobs.length === 0 ? 'Publish a job to receive applicants.' : 'No one in this stage yet.'}
        </p>
      ) : (
        <ul className="divide-y divide-[#E5E7EB]">
          {filtered.map(({ app, jobTitle }) => (
            <li key={app.id} className="flex flex-wrap items-center gap-3 py-3">
              <span
                className="grid h-9 w-9 place-items-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {`${app.person.firstName?.[0] ?? ''}${app.person.lastName?.[0] ?? ''}`.toUpperCase() || 'WA'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#1E293B]">
                  {[app.person.firstName, app.person.lastName].filter(Boolean).join(' ') || app.person.waId}{' '}
                  <span className="font-mono text-xs text-[#94A3B8]">{app.person.waId}</span>
                </p>
                <p className="truncate text-xs text-[#64748B]">{jobTitle}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stageTone[app.stage]}`}>
                {app.stage}
              </span>
              <select
                value={app.stage}
                onChange={(e) => setStage(app.id, e.target.value as ApplicationStage)}
                className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
              >
                {APPLICATION_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
