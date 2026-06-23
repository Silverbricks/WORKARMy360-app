'use client';

import { useEffect, useState } from 'react';
import type { ModerationJob } from '@workarmy/types';
import { Alert, Button, Card } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

export function JobsModeration() {
  const [jobs, setJobs] = useState<ModerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setJobs(await api.admin.jobs());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function close(id: string) {
    setBusy(id);
    setError(null);
    try {
      await api.admin.closeJob(id);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Jobs Moderation</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {loading ? (
        <div className="py-16 text-center text-[#64748B]">Loading…</div>
      ) : jobs.length === 0 ? (
        <Card className="p-6 text-sm text-[#64748B]">No jobs on the platform yet.</Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <Card key={j.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <div className="font-medium text-[#1E293B]">{j.title}</div>
                <div className="mt-0.5 text-sm text-[#64748B]">
                  {[j.orgName, j.state, j.status].filter(Boolean).join(' · ')}
                </div>
              </div>
              {j.status !== 'CLOSED' ? (
                <Button size="sm" variant="danger" loading={busy === j.id} onClick={() => close(j.id)}>
                  Take down
                </Button>
              ) : (
                <span className="text-xs text-[#94A3B8]">Closed</span>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
