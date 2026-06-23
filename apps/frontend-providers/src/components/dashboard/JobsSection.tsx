'use client';

import { type FormEvent, useEffect, useState } from 'react';
import {
  APPLICATION_STAGES,
  type Applicant,
  type ApplicationStage,
  type Job,
  type JobInput,
} from '@workarmy/types';
import { Alert, Button, Card, Field, Input } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

const EMPTY: JobInput = { title: '', description: '', employmentType: '', location: '', state: '' };

const statusTone: Record<string, string> = {
  DRAFT: 'bg-[#F1F5F9] text-[#64748B]',
  PUBLISHED: 'bg-[#DCFCE7] text-[#166534]',
  CLOSED: 'bg-[#FEE2E2] text-[#991B1B]',
  ARCHIVED: 'bg-[#F1F5F9] text-[#64748B]',
};

export function JobsSection({ title }: { title: string }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState<JobInput>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openJob, setOpenJob] = useState<string | null>(null);

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
        setError(errorMessage(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function createJob(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.jobs.create(form);
      setForm(EMPTY);
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">{title}</h1>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : 'Post a job'}</Button>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}

      {showForm ? (
        <Card className="p-6">
          <form onSubmit={createJob} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field id="title" label="Job title">
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field id="description" label="Description">
                <Input id="description" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
            </div>
            <Field id="employmentType" label="Employment type">
              <Input id="employmentType" placeholder="casual / seasonal / full-time" value={form.employmentType ?? ''} onChange={(e) => setForm({ ...form, employmentType: e.target.value })} />
            </Field>
            <Field id="location" label="Location">
              <Input id="location" value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>
            <Field id="state" label="State">
              <Input id="state" placeholder="VIC / NSW / QLD" value={form.state ?? ''} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </Field>
            <Field id="payUnit" label="Pay unit">
              <Input id="payUnit" placeholder="hour / day / week" value={form.payUnit ?? ''} onChange={(e) => setForm({ ...form, payUnit: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" loading={busy}>
                Create as draft
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {jobs.length === 0 ? (
        <Card className="p-6 text-sm text-[#64748B]">No jobs yet. Post one to start hiring.</Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#1E293B]">{job.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusTone[job.status]}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="mt-0.5 text-sm text-[#64748B]">
                    {[job.location, job.state, job.employmentType].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>
                <div className="flex gap-2">
                  {job.status === 'DRAFT' ? (
                    <Button size="sm" onClick={() => act(() => api.jobs.publish(job.id))}>
                      Publish
                    </Button>
                  ) : null}
                  {job.status === 'PUBLISHED' ? (
                    <Button size="sm" variant="secondary" onClick={() => act(() => api.jobs.close(job.id))}>
                      Close
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => setOpenJob(openJob === job.id ? null : job.id)}>
                    {openJob === job.id ? 'Hide applicants' : 'Applicants'}
                  </Button>
                </div>
              </div>
              {openJob === job.id ? <ApplicantsPanel jobId={job.id} /> : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicantsPanel({ jobId }: { jobId: string }) {
  const [applicants, setApplicants] = useState<Applicant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setApplicants(await api.applications.forJob(jobId));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  async function setStage(id: string, toStage: ApplicationStage) {
    try {
      await api.applications.changeStage(id, { toStage });
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <div className="mt-4 border-t border-[#E5E7EB] pt-4">
      {error ? <Alert tone="error">{error}</Alert> : null}
      {!applicants ? (
        <p className="text-sm text-[#64748B]">Loading applicants…</p>
      ) : applicants.length === 0 ? (
        <p className="text-sm text-[#64748B]">No applicants yet.</p>
      ) : (
        <ul className="space-y-2">
          {applicants.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-[#1E293B]">
                {[a.person.firstName, a.person.lastName].filter(Boolean).join(' ') || a.person.waId}{' '}
                <span className="font-mono text-xs text-[#94A3B8]">{a.person.waId}</span>
              </span>
              <select
                value={a.stage}
                onChange={(e) => setStage(a.id, e.target.value as ApplicationStage)}
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
    </div>
  );
}
