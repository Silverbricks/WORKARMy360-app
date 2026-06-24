'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { WorkerShift } from '@workarmy/types';
import { Alert, Button, Card, Icon } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { useWorkReady } from './DashboardShell';

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SwapShiftsSection() {
  const workReady = useWorkReady();
  const [shifts, setShifts] = useState<WorkerShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.work
      .myShifts()
      .then((s) => active && setShifts(s))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const upcoming = shifts.filter(
    (s) => new Date(s.shift.endAt) >= new Date() && s.shift.status !== 'CANCELLED',
  );

  async function requestSwap(assignmentId: string) {
    setError(null);
    setInfo(null);
    setBusy(assignmentId);
    try {
      await api.work.requestSwap(assignmentId);
      setInfo('Swap requested — your employer will review it.');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Swap Shifts</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">Request to swap one of your assigned shifts.</p>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {info ? <Alert tone="success">{info}</Alert> : null}

      {!workReady ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4" style={{ borderColor: '#EAD3A1', backgroundColor: '#FBF1DD' }}>
          <div className="flex items-center gap-2.5">
            <Icon name="lock" size={18} className="text-[#854D0E]" />
            <p className="text-sm text-[#854D0E]">Complete Work Readiness before managing shifts.</p>
          </div>
          <Link href="/dashboard/work-readiness">
            <Button size="sm">Complete Work Readiness →</Button>
          </Link>
        </Card>
      ) : null}

      {loading ? (
        <div className="py-12 text-center text-[#64748B]">Loading…</div>
      ) : upcoming.length === 0 ? (
        <Card className="p-6 text-sm text-[#64748B]">No upcoming shifts to swap.</Card>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-[#F1F5F9]">
            {upcoming.map((s) => (
              <li key={s.assignmentId} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#1E293B]">{s.shift.title}</p>
                  <p className="text-xs text-[#64748B]">
                    {s.org.name} · {fmt(s.shift.startAt)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!workReady || busy === s.assignmentId}
                  loading={busy === s.assignmentId}
                  onClick={() => requestSwap(s.assignmentId)}
                >
                  Request swap
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
