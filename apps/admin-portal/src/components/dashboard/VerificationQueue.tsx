'use client';

import { useEffect, useState } from 'react';
import type { VerificationItem } from '@workarmy/types';
import { Alert, Button, Card } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

export function VerificationQueue() {
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setItems(await api.admin.verifications('PENDING'));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function review(id: string, action: 'approve' | 'reject') {
    setBusy(id);
    setError(null);
    try {
      if (action === 'approve') await api.admin.approve(id);
      else await api.admin.reject(id);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Verification Queue</h1>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {loading ? (
        <div className="py-16 text-center text-[#64748B]">Loading…</div>
      ) : items.length === 0 ? (
        <Card className="p-6 text-sm text-[#64748B]">Nothing pending. 🎉</Card>
      ) : (
        <div className="space-y-3">
          {items.map((v) => (
            <Card key={v.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <div className="font-medium text-[#1E293B]">{v.subject.name}</div>
                <div className="mt-0.5 text-sm text-[#64748B]">
                  <span className="font-mono text-xs">{v.subject.waId}</span> · {v.subject.kind}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" loading={busy === v.id} onClick={() => review(v.id, 'approve')}>
                  Approve
                </Button>
                <Button size="sm" variant="danger" disabled={busy === v.id} onClick={() => review(v.id, 'reject')}>
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
