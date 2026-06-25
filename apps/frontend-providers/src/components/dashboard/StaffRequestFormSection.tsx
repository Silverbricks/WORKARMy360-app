'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { StaffRequest, StaffRequestInput } from '@workarmy/types';
import { Alert, Button, Card, Field, Input } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { useMe } from './DashboardShell';
import { StaffRequestList } from './UrgentBulkSection';

type Form = Required<Omit<StaffRequestInput, 'partnerLabels' | 'type' | 'urgency'>> & {
  urgency: NonNullable<StaffRequestInput['urgency']>;
  partners: string;
};

const EMPTY: Form = {
  urgency: 'NORMAL',
  roleTitle: '',
  industry: '',
  description: '',
  employmentType: 'Casual',
  site: '',
  siteAddress: '',
  suburb: '',
  state: '',
  startDate: '',
  shiftType: 'Day',
  startTime: '',
  finishTime: '',
  headcountTotal: 5,
  headcountMale: 0,
  headcountFemale: 0,
  headcountAny: 0,
  days: '',
  skills: '',
  licences: '',
  experience: 'No Experience',
  english: 'Intermediate',
  ppe: '',
  ppeSupplied: false,
  reportToName: '',
  reportToRole: '',
  reportToMobile: '',
  reportToLocation: '',
  siteNotes: '',
  payRate: '',
  payBasis: 'Hourly',
  award: '',
  transport: false,
  accommodation: false,
  meals: false,
  additionalNotes: '',
  partners: '',
};

const URGENCIES: NonNullable<StaffRequestInput['urgency']>[] = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'];

export function StaffRequestFormSection() {
  const me = useMe();
  const [form, setForm] = useState<Form>(EMPTY);
  const [requests, setRequests] = useState<StaffRequest[]>([]);
  const [declared, setDeclared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function load() {
    setRequests(await api.staffing.requests.list());
  }
  useEffect(() => {
    setForm((f) => ({ ...f, roleTitle: f.roleTitle }));
    load().catch((e) => setError(errorMessage(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.roleTitle.trim()) {
      setError('Enter the job title / role.');
      return;
    }
    if (!declared) {
      setError('Please confirm the declaration before sending.');
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const { partners, ...rest } = form;
      const partnerLabels = partners.split(',').map((s) => s.trim()).filter(Boolean);
      await api.staffing.requests.create({
        type: form.urgency === 'HIGH' || form.urgency === 'CRITICAL' ? 'URGENT_SHIFT' : 'BULK_CREW',
        ...rest,
        partnerLabels,
      });
      setForm(EMPTY);
      setDeclared(false);
      setInfo('Request sent to WorkArmy Super Admin' + (partnerLabels.length ? ` + ${partnerLabels.length} partner(s).` : '.'));
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  }

  const selectCls =
    'h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]';
  const sec = 'text-xs font-bold uppercase tracking-wide text-[color:var(--accent)] mb-3';

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h1 className="text-2xl">Create Staff Request</h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Bulk or urgent staff request — sent to WorkArmy Super Admin and your chosen contractors / agencies.
        </p>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {info ? <Alert tone="success">{info}</Alert> : null}

      <Card className="p-5">
        <p className={sec}>① Request type &amp; urgency</p>
        <div className="flex flex-wrap gap-2">
          {URGENCIES.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => set('urgency', u)}
              className="rounded-full border px-3 py-1.5 text-sm"
              style={
                form.urgency === u
                  ? { borderColor: 'var(--accent)', color: 'var(--accent)', backgroundColor: 'color-mix(in srgb, var(--accent) 8%, white)' }
                  : { borderColor: '#E5E7EB', color: '#64748B' }
              }
            >
              {u}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <p className={sec}>② Job details</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="role" label="Job title / role"><Input id="role" value={form.roleTitle} onChange={(e) => set('roleTitle', e.target.value)} placeholder="e.g. Pick Packer" /></Field>
          <Field id="industry" label="Industry"><Input id="industry" value={form.industry} onChange={(e) => set('industry', e.target.value)} placeholder="Warehouse / Farm…" /></Field>
          <Field id="emp" label="Employment type"><Input id="emp" value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)} /></Field>
          <Field id="total" label="Total staff required"><Input id="total" type="number" value={String(form.headcountTotal)} onChange={(e) => set('headcountTotal', Number(e.target.value))} /></Field>
          <Field id="male" label="Male"><Input id="male" type="number" value={String(form.headcountMale)} onChange={(e) => set('headcountMale', Number(e.target.value))} /></Field>
          <Field id="female" label="Female"><Input id="female" type="number" value={String(form.headcountFemale)} onChange={(e) => set('headcountFemale', Number(e.target.value))} /></Field>
        </div>
        <div className="mt-3"><Field id="desc" label="Description"><Input id="desc" value={form.description} onChange={(e) => set('description', e.target.value)} /></Field></div>
      </Card>

      <Card className="p-5">
        <p className={sec}>③ Shift information</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="sdate" label="Start date"><Input id="sdate" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} /></Field>
          <Field id="stype" label="Shift type">
            <select id="stype" value={form.shiftType} onChange={(e) => set('shiftType', e.target.value)} className={selectCls}>
              {['Day', 'Afternoon', 'Night', 'Rotating'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field id="stime" label="Start time"><Input id="stime" type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} /></Field>
          <Field id="ftime" label="Finish time"><Input id="ftime" type="time" value={form.finishTime} onChange={(e) => set('finishTime', e.target.value)} /></Field>
          <Field id="days" label="Days required"><Input id="days" value={form.days} onChange={(e) => set('days', e.target.value)} placeholder="Mon, Tue, Wed…" /></Field>
        </div>
      </Card>

      <Card className="p-5">
        <p className={sec}>④ Skills, experience &amp; PPE</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="skills" label="Skills / licences required"><Input id="skills" value={form.skills} onChange={(e) => set('skills', e.target.value)} placeholder="Forklift LF, White Card…" /></Field>
          <Field id="lic" label="Licences"><Input id="lic" value={form.licences} onChange={(e) => set('licences', e.target.value)} placeholder="MR, HR, Driver…" /></Field>
          <Field id="exp" label="Experience required">
            <select id="exp" value={form.experience} onChange={(e) => set('experience', e.target.value)} className={selectCls}>
              {['No Experience', '6 Months', '1 Year', '2+ Years', 'Experienced Only'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field id="eng" label="English level">
            <select id="eng" value={form.english} onChange={(e) => set('english', e.target.value)} className={selectCls}>
              {['Basic', 'Intermediate', 'Fluent'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field id="ppe" label="PPE required"><Input id="ppe" value={form.ppe} onChange={(e) => set('ppe', e.target.value)} placeholder="Safety Boots, Hi-Vis…" /></Field>
        </div>
        <label className="mt-2 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.ppeSupplied} onChange={(e) => set('ppeSupplied', e.target.checked)} /> PPE supplied by client</label>
      </Card>

      <Card className="p-5">
        <p className={sec}>⑤ Work location &amp; site reporting</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="site" label="Site / business name"><Input id="site" value={form.site} onChange={(e) => set('site', e.target.value)} /></Field>
          <Field id="saddr" label="Site address"><Input id="saddr" value={form.siteAddress} onChange={(e) => set('siteAddress', e.target.value)} /></Field>
          <Field id="rname" label="Report to (name)"><Input id="rname" value={form.reportToName} onChange={(e) => set('reportToName', e.target.value)} /></Field>
          <Field id="rrole" label="Position"><Input id="rrole" value={form.reportToRole} onChange={(e) => set('reportToRole', e.target.value)} placeholder="Site Manager…" /></Field>
          <Field id="rmob" label="Mobile"><Input id="rmob" value={form.reportToMobile} onChange={(e) => set('reportToMobile', e.target.value)} /></Field>
          <Field id="rloc" label="Report-to location"><Input id="rloc" value={form.reportToLocation} onChange={(e) => set('reportToLocation', e.target.value)} placeholder="Reception…" /></Field>
        </div>
        <div className="mt-3"><Field id="snotes" label="Site access / induction notes"><Input id="snotes" value={form.siteNotes} onChange={(e) => set('siteNotes', e.target.value)} /></Field></div>
      </Card>

      <Card className="p-5">
        <p className={sec}>⑥ Pay &amp; logistics</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field id="prate" label="Hourly rate ($)"><Input id="prate" value={form.payRate} onChange={(e) => set('payRate', e.target.value)} placeholder="$" /></Field>
          <Field id="pbasis" label="Pay basis">
            <select id="pbasis" value={form.payBasis} onChange={(e) => set('payBasis', e.target.value)} className={selectCls}>
              {['Hourly', 'Piece rate', 'Daily'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field id="award" label="Award / EA"><Input id="award" value={form.award} onChange={(e) => set('award', e.target.value)} /></Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.transport} onChange={(e) => set('transport', e.target.checked)} /> Transport provided</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.accommodation} onChange={(e) => set('accommodation', e.target.checked)} /> Accommodation</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.meals} onChange={(e) => set('meals', e.target.checked)} /> Meals</label>
        </div>
        <div className="mt-3"><Field id="notes" label="Additional information"><Input id="notes" value={form.additionalNotes} onChange={(e) => set('additionalNotes', e.target.value)} /></Field></div>
      </Card>

      <Card className="p-5">
        <p className={sec}>⑦ Send to &amp; declaration</p>
        <p className="mb-2 text-sm text-[#475569]">
          📣 <b>WorkArmy Super Admin</b> is always notified. Add contractors / agencies (comma-separated) to also send to:
        </p>
        <Field id="partners" label="Contractors / agencies">
          <Input id="partners" value={form.partners} onChange={(e) => set('partners', e.target.value)} placeholder="Aussie Work Force, GreenThumb Contractors" />
        </Field>
        <label className="mt-3 flex items-start gap-2 text-sm text-[#475569]">
          <input type="checkbox" className="mt-0.5" checked={declared} onChange={(e) => setDeclared(e.target.checked)} />
          I confirm the information is correct and the workplace complies with all applicable WHS requirements
          ({me.organisation.name}).
        </label>
        <div className="mt-4">
          <Button type="submit" loading={busy}>📨 Send request</Button>
        </div>
      </Card>

      <StaffRequestList requests={requests} />
    </form>
  );
}
