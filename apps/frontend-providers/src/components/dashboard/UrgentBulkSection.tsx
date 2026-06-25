'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { StaffRequest } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

const STAFF_TYPES = ['Fruit Picker', 'Pick Packer', 'Driver', 'Forklift Operator', 'Farm Hand', 'Packer', 'Cleaner', 'Labourer', 'Warehouse', 'Security', 'Hospitality'];

export function UrgentBulkSection() {
  const [requests, setRequests] = useState<StaffRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [uRole, setURole] = useState('');
  const [uWhen, setUWhen] = useState('');
  const [bType, setBType] = useState(STAFF_TYPES[0]);
  const [bQty, setBQty] = useState('10');
  const [bDate, setBDate] = useState('');

  async function load() {
    setRequests(await api.staffing.requests.list());
  }
  useEffect(() => {
    load().catch((e) => setError(errorMessage(e)));
  }, []);

  async function raise(kind: 'urgent' | 'bulk') {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (kind === 'urgent') {
        if (!uRole.trim()) throw new Error('Enter a role.');
        await api.staffing.requests.create({
          type: 'URGENT_SHIFT',
          urgency: 'HIGH',
          roleTitle: uRole,
          startDate: uWhen,
        });
        setURole('');
        setUWhen('');
      } else {
        await api.staffing.requests.create({
          type: 'BULK_CREW',
          roleTitle: bType,
          headcountTotal: Number(bQty) || 1,
          startDate: bDate,
        });
        setBDate('');
      }
      setInfo('Request raised and sent to WorkArmy Super Admin.');
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const selectCls =
    'h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl">Urgent &amp; Bulk Staffing</h1>
        <p className="mt-1 text-sm text-[#64748B]">Raise urgent shifts or bulk crew requests and fill them fast.</p>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {info ? <Alert tone="success">{info}</Alert> : null}

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Icon name="clipboard" size={22} style={{ color: 'var(--accent)' }} />
        <p className="flex-1 text-sm text-[#475569]">
          Need a detailed request to Super Admin or partners? Use the full form.
        </p>
        <Link href="/dashboard/staff-request">
          <Button>Create Staff Request →</Button>
        </Link>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-[#FCD34D] bg-[#FFFBEB] p-5">
          <p className="mb-1 flex items-center gap-2 font-semibold text-[#92400E]">
            <Icon name="zap" size={18} /> Urgent shift
          </p>
          <p className="mb-3 text-xs text-[#92400E]">Pushes to nearby verified workers on the urgent list.</p>
          <Field id="uRole" label="Role">
            <Input id="uRole" value={uRole} onChange={(e) => setURole(e.target.value)} placeholder="e.g. Pickers × 4" />
          </Field>
          <Field id="uWhen" label="When">
            <Input id="uWhen" type="datetime-local" value={uWhen} onChange={(e) => setUWhen(e.target.value)} />
          </Field>
          <Button loading={busy} onClick={() => raise('urgent')}>Push urgent shift</Button>
        </Card>

        <Card className="p-5">
          <p className="mb-1 flex items-center gap-2 font-semibold text-[#1E293B]">
            <Icon name="users" size={18} /> Bulk crew request
          </p>
          <p className="mb-3 text-xs text-[#64748B]">Request a large crew via your network or WorkArmy.</p>
          <Field id="bType" label="Staff type">
            <select id="bType" value={bType} onChange={(e) => setBType(e.target.value)} className={selectCls}>
              {STAFF_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="bQty" label="How many">
              <Input id="bQty" type="number" value={bQty} onChange={(e) => setBQty(e.target.value)} />
            </Field>
            <Field id="bDate" label="Start date">
              <Input id="bDate" type="date" value={bDate} onChange={(e) => setBDate(e.target.value)} />
            </Field>
          </div>
          <Button loading={busy} onClick={() => raise('bulk')}>Request bulk crew</Button>
        </Card>
      </div>

      <StaffRequestList requests={requests} />
    </div>
  );
}

export function StaffRequestList({ requests }: { requests: StaffRequest[] }) {
  const tone: Record<string, string> = {
    SENT: 'bg-[#FEF3C7] text-[#92400E]',
    ACKNOWLEDGED: 'bg-[#DBEAFE] text-[#1E40AF]',
    FILLED: 'bg-[#DCFCE7] text-[#166534]',
    CLOSED: 'bg-[#F1F5F9] text-[#64748B]',
    CANCELLED: 'bg-[#FEE2E2] text-[#991B1B]',
  };
  return (
    <Card className="p-4">
      <p className="mb-2 text-sm font-semibold text-[#1E293B]">Requests ({requests.length})</p>
      {requests.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#94A3B8]">No requests yet.</p>
      ) : (
        <ul className="divide-y divide-[#E5E7EB]">
          {requests.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F1F5F9]">
                <Icon name={r.type === 'URGENT_SHIFT' ? 'zap' : 'users'} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#1E293B]">
                  {r.headcountTotal} × {r.roleTitle}
                </p>
                <p className="truncate text-xs text-[#64748B]">
                  {r.type.replace(/_/g, ' ').toLowerCase()} · {r.urgency.toLowerCase()} · to{' '}
                  {r.recipients.map((x) => x.recipientLabel).filter(Boolean).join(', ') || '—'}
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone[r.status] ?? tone.SENT}`}>
                {r.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
