'use client';

import { type FormEvent, useEffect, useState } from 'react';
import {
  type CredentialView,
  type DocumentView,
  type PersonProfileUpdate,
  type WorkExperience,
  USER_TYPES,
} from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input, cn } from '@workarmy/ui';
import { api, fileDownloadUrl } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { FileUploadButton } from './FileUploadButton';

const inputCls =
  'h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]';
const areaCls =
  'min-h-[88px] w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]';

const AU_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const AVAILABILITY = ['Full-time', 'Part-time', 'Casual', 'Seasonal', 'Contract'];
const HIRE_STATUS = [
  { value: 'AVAILABLE_NOW', label: 'Available immediately' },
  { value: 'AVAILABLE_SOON', label: 'Available soon' },
  { value: 'OPEN', label: 'Open to opportunities' },
  { value: 'NOT_LOOKING', label: 'Not currently looking' },
];
const INDUSTRIES = ['Agriculture', 'Warehousing', 'Hospitality', 'Healthcare', 'Construction', 'Logistics', 'Retail', 'Manufacturing', 'Aged Care', 'Cleaning'];
const JOB_TYPES = ['Farm work', 'Warehouse', 'Pick & pack', 'Support work', 'Healthcare', 'Hospitality', 'Construction', 'Trades', 'General labour', 'Driving'];
const CATEGORIES = ['Job-ready worker', 'Skilled / professional', 'Farm / labourer / trade', 'Healthcare / hospitality', 'Warehouse / logistics', 'Backpacker', 'Apprentice / trainee', 'Volunteer', 'Other'];
const CRED_TYPES = [
  { label: 'Qualifications', types: ['Certificate', 'Diploma', 'Degree', 'Trade qualification'] },
  { label: 'Licences', types: ['Driver licence', 'Forklift licence', 'White card', 'Working with children check', 'First aid certificate'] },
  { label: 'Identity & checks', types: ['100-point ID', 'Right to work', 'Police check'] },
];

const STEPS = ['Personal', 'Professional', 'Availability', 'Experience', 'Qualifications', 'Review'] as const;
type Values = Required<{ [K in keyof PersonProfileUpdate]: string }>;
const EMPTY: Values = {
  firstName: '', lastName: '', mobile: '', photoUrl: '', dateOfBirth: '', gender: '', nationality: '',
  addressLine: '', suburb: '', state: '', postcode: '', emergencyName: '', emergencyPhone: '',
  headline: '', about: '', skills: '', industries: '', languages: '',
  availability: '', availableDays: '', availableHours: '', hireStatus: '',
};

function splitCsv(v: string | null | undefined): string[] {
  return v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

function Chips({ options, value, onChange, max }: { options: readonly string[]; value: string[]; onChange: (v: string[]) => void; max?: number }) {
  function toggle(opt: string) {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else if (!max || value.length < max) onChange([...value, opt]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = value.includes(opt);
        return (
          <button key={opt} type="button" onClick={() => toggle(opt)} className="rounded-full border px-3 py-1 text-sm transition"
            style={on ? { backgroundColor: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : { borderColor: '#E5E7EB', color: '#1E293B' }}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function ProfileWizard() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(EMPTY);
  const [userTypes, setUserTypes] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>(['', '', '']);
  const [category, setCategory] = useState('');
  const [payMin, setPayMin] = useState('');
  const [relocate, setRelocate] = useState(false);
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [creds, setCreds] = useState<CredentialView[]>([]);
  const [completeness, setCompleteness] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [confirmInfo, setConfirmInfo] = useState(false);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [me, credList] = await Promise.all([api.persons.getMe(), api.credentials.list().catch(() => [])]);
        if (!active) return;
        const p = me.profile;
        setValues({
          firstName: me.firstName ?? '', lastName: me.lastName ?? '', mobile: me.mobile ?? '',
          photoUrl: p?.photoUrl ?? '', dateOfBirth: p?.dateOfBirth ?? '', gender: p?.gender ?? '',
          nationality: p?.nationality ?? '', addressLine: p?.addressLine ?? '', suburb: p?.suburb ?? '',
          state: p?.state ?? '', postcode: p?.postcode ?? '', emergencyName: p?.emergencyName ?? '',
          emergencyPhone: p?.emergencyPhone ?? '', headline: p?.headline ?? '', about: p?.about ?? '',
          skills: p?.skills ?? '', industries: p?.industries ?? '', languages: p?.languages ?? '',
          availability: p?.availability ?? '', availableDays: p?.availableDays ?? '',
          availableHours: p?.availableHours ?? '', hireStatus: p?.hireStatus ?? '',
        });
        const pr = me.preferences;
        setUserTypes(splitCsv(pr?.userTypes));
        setIndustries(splitCsv(pr?.preferredIndustries));
        setJobTypes(splitCsv(pr?.preferredJobTypes));
        const locs = splitCsv(pr?.preferredLocations);
        setLocations([locs[0] ?? '', locs[1] ?? '', locs[2] ?? '']);
        setCategory(pr?.seekerCategory ?? '');
        setPayMin(pr?.preferredPayMin != null ? String(pr.preferredPayMin) : '');
        setRelocate(pr?.willingToRelocate ?? false);
        setExperiences(me.experiences);
        setCompleteness(p?.completeness ?? 0);
        setCreds(credList);
      } catch (e) {
        if (active) setError(errorMessage(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const set = (name: keyof Values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [name]: e.target.value }));

  async function persist(): Promise<void> {
    const profile = await api.persons.updateProfile(values);
    setCompleteness(profile.completeness);
    await api.persons.updatePreferences({
      seekerCategory: category,
      userTypes: userTypes.join(','),
      preferredIndustries: industries.join(','),
      preferredJobTypes: jobTypes.join(','),
      preferredLocations: locations.map((s) => s.trim()).filter(Boolean).join(','),
      willingToRelocate: relocate,
      preferredPayMin: payMin ? Number(payMin) : undefined,
    });
  }

  async function saveDraft() {
    setBusy(true); setError(null); setSavedMsg(false);
    try { await persist(); setSavedMsg(true); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }

  async function next() {
    setError(null);
    // persist editable data when leaving the first three steps
    if (step <= 2) {
      setBusy(true);
      try { await persist(); } catch (e) { setError(errorMessage(e)); setBusy(false); return; }
      setBusy(false);
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() { setError(null); setStep((s) => Math.max(s - 1, 0)); }

  async function submit() {
    setBusy(true); setError(null);
    try {
      await persist();
      await api.persons.complete();
      // full reload so the dashboard shell re-fetches `me` and unlocks every section
      window.location.href = '/dashboard';
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl">Complete your profile</h1>
          <p className="mt-0.5 text-sm text-[#64748B]">Finish all steps to unlock jobs and the rest of your dashboard.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#64748B]">Completeness</div>
          <div className="text-lg font-semibold" style={{ color: 'var(--accent)' }}>{completeness}%</div>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
        <div className="h-full rounded-full transition-all" style={{ width: `${completeness}%`, backgroundColor: 'var(--accent)' }} />
      </div>

      {/* step nav */}
      <div className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <button key={label} type="button" onClick={() => i < step && setStep(i)}
            className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm', i === step ? 'text-white' : i < step ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#F1F5F9] text-[#94A3B8]')}
            style={i === step ? { backgroundColor: 'var(--accent)' } : undefined}>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-white/25 text-xs">{i < step ? '✓' : i + 1}</span>
            {label}
          </button>
        ))}
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {savedMsg ? <Alert tone="success">Draft saved.</Alert> : null}

      {step === 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#1E293B]">Personal information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="firstName" label="First name"><Input id="firstName" value={values.firstName} onChange={set('firstName')} /></Field>
            <Field id="lastName" label="Last name"><Input id="lastName" value={values.lastName} onChange={set('lastName')} /></Field>
            <Field id="mobile" label="Mobile"><Input id="mobile" value={values.mobile} onChange={set('mobile')} placeholder="04xx xxx xxx" /></Field>
            <Field id="dob" label="Date of birth"><input id="dob" type="date" value={values.dateOfBirth} onChange={set('dateOfBirth')} className={inputCls} /></Field>
            <Field id="gender" label="Gender">
              <select id="gender" value={values.gender} onChange={set('gender')} className={inputCls}><option value="">Select…</option>{GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}</select>
            </Field>
            <Field id="nationality" label="Nationality"><Input id="nationality" value={values.nationality} onChange={set('nationality')} /></Field>
            <div className="sm:col-span-2"><Field id="addressLine" label="Address"><Input id="addressLine" value={values.addressLine} onChange={set('addressLine')} /></Field></div>
            <Field id="suburb" label="Suburb"><Input id="suburb" value={values.suburb} onChange={set('suburb')} /></Field>
            <Field id="state" label="State"><select id="state" value={values.state} onChange={set('state')} className={inputCls}><option value="">Select…</option>{AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
            <Field id="postcode" label="Postcode"><Input id="postcode" value={values.postcode} onChange={set('postcode')} /></Field>
            <Field id="emergencyName" label="Emergency contact"><Input id="emergencyName" value={values.emergencyName} onChange={set('emergencyName')} /></Field>
            <Field id="emergencyPhone" label="Emergency phone"><Input id="emergencyPhone" value={values.emergencyPhone} onChange={set('emergencyPhone')} /></Field>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#1E293B]">Professional information</h2>
          <div className="grid grid-cols-1 gap-4">
            <Field id="headline" label="Professional headline"><Input id="headline" value={values.headline} onChange={set('headline')} placeholder="e.g. Forklift operator · 5 years warehouse" /></Field>
            <Field id="about" label="About me"><textarea id="about" value={values.about} onChange={set('about')} className={areaCls} /></Field>
            <Field id="skills" label="Skills" hint="Comma separated"><textarea id="skills" value={values.skills} onChange={set('skills')} className={areaCls} /></Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="industries" label="Industries"><Input id="industries" value={values.industries} onChange={set('industries')} /></Field>
              <Field id="languages" label="Languages"><Input id="languages" value={values.languages} onChange={set('languages')} /></Field>
            </div>
          </div>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-[#1E293B]">Availability &amp; hire-me status</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="availability" label="Availability"><select id="availability" value={values.availability} onChange={set('availability')} className={inputCls}><option value="">Select…</option>{AVAILABILITY.map((a) => <option key={a} value={a}>{a}</option>)}</select></Field>
              <Field id="hireStatus" label="Hire-me status"><select id="hireStatus" value={values.hireStatus} onChange={set('hireStatus')} className={inputCls}><option value="">Select…</option>{HIRE_STATUS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}</select></Field>
              <Field id="availableDays" label="Available days"><Input id="availableDays" value={values.availableDays} onChange={set('availableDays')} placeholder="Mon–Fri, weekends" /></Field>
              <Field id="availableHours" label="Available hours"><Input id="availableHours" value={values.availableHours} onChange={set('availableHours')} placeholder="Day / night / flexible" /></Field>
            </div>
          </Card>
          <Card className="p-6 space-y-5">
            <h2 className="text-lg font-semibold text-[#1E293B]">Job preferences</h2>
            <div><p className="mb-2 text-sm font-medium text-[#1E293B]">I identify as</p><Chips options={USER_TYPES} value={userTypes} onChange={setUserTypes} /></div>
            <Field id="cat" label="Job seeker category"><select id="cat" value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}><option value="">Select…</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
            <div><p className="mb-2 text-sm font-medium text-[#1E293B]">Preferred industries</p><Chips options={INDUSTRIES} value={industries} onChange={setIndustries} /></div>
            <div><p className="mb-2 text-sm font-medium text-[#1E293B]">Preferred job types</p><Chips options={JOB_TYPES} value={jobTypes} onChange={setJobTypes} /></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => <Field key={i} id={`loc${i}`} label={`Location ${i + 1}`}><Input id={`loc${i}`} value={locations[i]} onChange={(e) => setLocations((v) => v.map((x, idx) => idx === i ? e.target.value : x))} /></Field>)}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="payMin" label="Minimum pay ($/hour)"><Input id="payMin" type="number" value={payMin} onChange={(e) => setPayMin(e.target.value)} /></Field>
              <label className="flex items-center gap-2 self-end pb-3 text-sm text-[#1E293B]"><input type="checkbox" checked={relocate} onChange={(e) => setRelocate(e.target.checked)} /> Willing to relocate</label>
            </div>
          </Card>
        </div>
      )}

      {step === 3 && <ExperienceStep experiences={experiences} onChange={setExperiences} />}

      {step === 4 && <QualificationsStep creds={creds} reload={async () => setCreds(await api.credentials.list())} />}

      {step === 5 && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold text-[#1E293B]">Review</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ['Name', `${values.firstName} ${values.lastName}`.trim() || '—'],
                ['Mobile', values.mobile || '—'],
                ['Availability', values.availability || '—'],
                ['User types', userTypes.length ? `${userTypes.length} selected` : '—'],
                ['Experience', experiences.length ? `${experiences.length} added` : 'None'],
                ['Credentials', creds.length ? `${creds.length} added` : 'None'],
              ].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-[#F8FAFC] p-3"><div className="text-xs text-[#64748B]">{l}</div><div className="text-sm font-semibold text-[#1E293B]">{v}</div></div>
              ))}
            </div>
          </Card>
          <Card className="p-6 space-y-3">
            <label className="flex items-start gap-3 text-sm text-[#1E293B]"><input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5" /> I agree to the Terms &amp; Conditions and Privacy Policy.</label>
            <label className="flex items-start gap-3 text-sm text-[#1E293B]"><input type="checkbox" checked={confirmInfo} onChange={(e) => setConfirmInfo(e.target.checked)} className="mt-0.5" /> I confirm the information in my profile is accurate and complete.</label>
          </Card>
        </div>
      )}

      {/* footer */}
      <div className="sticky bottom-0 -mx-1 flex items-center justify-between gap-3 border-t border-[#E5E7EB] bg-white/90 px-1 py-3 backdrop-blur">
        <Button type="button" variant="ghost" onClick={back} disabled={step === 0}>← Back</Button>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" loading={busy} onClick={saveDraft}>Save draft</Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" loading={busy} onClick={next}>Continue →</Button>
          ) : (
            <Button type="button" loading={busy} disabled={!agreeTerms || !confirmInfo} onClick={submit}>Submit profile →</Button>
          )}
        </div>
      </div>
    </div>
  );
}

const EMPTY_EXP = { employer: '', position: '', employmentType: '', location: '', startDate: '', endDate: '', current: false, summary: '' };

function ExperienceStep({ experiences, onChange }: { experiences: WorkExperience[]; onChange: (n: WorkExperience[]) => void }) {
  const [form, setForm] = useState(EMPTY_EXP);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try { const c = await api.persons.addExperience(form); onChange([c, ...experiences]); setForm(EMPTY_EXP); setShow(false); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  async function remove(id: string) {
    setError(null);
    try { await api.persons.deleteExperience(id); onChange(experiences.filter((x) => x.id !== id)); }
    catch (e) { setError(errorMessage(e)); }
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div><h2 className="text-lg font-semibold text-[#1E293B]">Work experience</h2><p className="text-sm text-[#64748B]">Optional, but it strengthens your profile.</p></div>
        <Button size="sm" variant="secondary" onClick={() => setShow((s) => !s)}>{show ? 'Cancel' : 'Add experience'}</Button>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {show ? (
        <form onSubmit={add} className="mb-5 grid grid-cols-1 gap-4 rounded-lg border border-[#E5E7EB] p-4 sm:grid-cols-2">
          <Field id="employer" label="Employer"><Input id="employer" value={form.employer} onChange={(e) => setForm({ ...form, employer: e.target.value })} /></Field>
          <Field id="position" label="Position"><Input id="position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></Field>
          <Field id="estart" label="Start date"><input id="estart" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputCls} /></Field>
          <Field id="eend" label="End date"><input id="eend" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputCls} disabled={form.current} /></Field>
          <label className="flex items-center gap-2 text-sm text-[#1E293B] sm:col-span-2"><input type="checkbox" checked={form.current} onChange={(e) => setForm({ ...form, current: e.target.checked })} /> I currently work here</label>
          <div className="sm:col-span-2"><Field id="esum" label="Summary"><textarea id="esum" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={areaCls} /></Field></div>
          <div className="sm:col-span-2"><Button type="submit" loading={busy}>Add</Button></div>
        </form>
      ) : null}
      {experiences.length === 0 ? (
        <p className="text-sm text-[#64748B]">No experience added yet.</p>
      ) : (
        <ul className="space-y-2">
          {experiences.map((x) => (
            <li key={x.id} className="flex items-start justify-between gap-3 rounded-lg border border-[#E5E7EB] p-3">
              <div><span className="font-medium text-[#1E293B]">{x.position || 'Role'}</span> <span className="text-sm text-[#64748B]">· {x.employer}</span>{x.current ? <span className="ml-2 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs text-[#166534]">Current</span> : null}</div>
              <button type="button" onClick={() => remove(x.id)} className="text-sm text-[#DC2626] hover:underline">Remove</button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function QualificationsStep({ creds, reload }: { creds: CredentialView[]; reload: () => Promise<void> }) {
  const [type, setType] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [doc, setDoc] = useState<DocumentView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!type) { setError('Choose a type.'); return; }
    setBusy(true); setError(null);
    try { await api.credentials.add({ type, identifier: identifier || undefined, documentId: doc?.id }); setType(''); setIdentifier(''); setDoc(null); await reload(); }
    catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  async function act(fn: () => Promise<unknown>) { setError(null); try { await fn(); await reload(); } catch (e) { setError(errorMessage(e)); } }

  const tone: Record<string, string> = { NONE: 'bg-[#F1F5F9] text-[#64748B]', PENDING: 'bg-[#FEF9C3] text-[#854D0E]', APPROVED: 'bg-[#DCFCE7] text-[#166534]', REJECTED: 'bg-[#FEE2E2] text-[#991B1B]' };

  return (
    <Card className="p-6">
      <div className="mb-4"><h2 className="text-lg font-semibold text-[#1E293B]">Qualifications &amp; ID</h2><p className="text-sm text-[#64748B]">Add certificates, licences and 100-point ID, then request verification. Optional.</p></div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <form onSubmit={add} className="mb-5 grid grid-cols-1 gap-4 rounded-lg border border-[#E5E7EB] p-4 sm:grid-cols-2">
        <Field id="ctype" label="Type">
          <select id="ctype" value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            <option value="">Select…</option>
            {CRED_TYPES.map((g) => <optgroup key={g.label} label={g.label}>{g.types.map((t) => <option key={t} value={t}>{t}</option>)}</optgroup>)}
          </select>
        </Field>
        <Field id="cid" label="Number / reference"><Input id="cid" value={identifier} onChange={(e) => setIdentifier(e.target.value)} /></Field>
        <div className="flex items-center gap-3 sm:col-span-2">
          <FileUploadButton kind="CERTIFICATE" label={doc ? 'Replace file' : 'Upload file'} onUploaded={setDoc} />
          {doc ? <span className="text-sm text-[#16A34A]">{doc.fileName}</span> : <span className="text-sm text-[#94A3B8]">No file attached</span>}
        </div>
        <div className="sm:col-span-2"><Button type="submit" loading={busy}>Add credential</Button></div>
      </form>
      {creds.length === 0 ? (
        <p className="text-sm text-[#64748B]">No credentials yet.</p>
      ) : (
        <ul className="space-y-2">
          {creds.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] p-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#1E293B]">{c.type}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${tone[c.verificationStatus]}`}>{c.verificationStatus === 'NONE' ? 'Not verified' : c.verificationStatus}</span>
                {c.document ? <a href={fileDownloadUrl(c.document.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--accent)' }}><Icon name="file" size={12} /> file</a> : null}
              </div>
              <div className="flex gap-2">
                {c.verificationStatus === 'NONE' || c.verificationStatus === 'REJECTED' ? <button type="button" onClick={() => act(() => api.credentials.requestVerification({ credentialId: c.id }))} className="text-xs" style={{ color: 'var(--accent)' }}>Request verification</button> : null}
                <button type="button" onClick={() => act(() => api.credentials.remove(c.id))} className="text-xs text-[#DC2626] hover:underline">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
