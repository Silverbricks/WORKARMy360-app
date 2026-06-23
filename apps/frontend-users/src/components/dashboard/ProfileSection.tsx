'use client';

import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import type { PersonProfileUpdate, WorkExperience, WorkExperienceInput } from '@workarmy/types';
import { Alert, Button, Card, Field, Input } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

type Values = Required<{ [K in keyof PersonProfileUpdate]: string }>;

const EMPTY_VALUES: Values = {
  firstName: '',
  lastName: '',
  mobile: '',
  photoUrl: '',
  dateOfBirth: '',
  gender: '',
  nationality: '',
  addressLine: '',
  suburb: '',
  state: '',
  postcode: '',
  emergencyName: '',
  emergencyPhone: '',
  headline: '',
  about: '',
  skills: '',
  industries: '',
  languages: '',
  availability: '',
  availableDays: '',
  availableHours: '',
  hireStatus: '',
};

const AU_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const AVAILABILITY = ['Full-time', 'Part-time', 'Casual', 'Seasonal', 'Contract'];
const HIRE_STATUS: { value: string; label: string }[] = [
  { value: 'AVAILABLE_NOW', label: 'Available immediately' },
  { value: 'AVAILABLE_SOON', label: 'Available soon' },
  { value: 'OPEN', label: 'Open to opportunities' },
  { value: 'NOT_LOOKING', label: 'Not currently looking' },
];

const inputCls =
  'h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]';
const areaCls =
  'min-h-[88px] w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]';

export function ProfileSection() {
  const [values, setValues] = useState<Values>(EMPTY_VALUES);
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [completeness, setCompleteness] = useState(0);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await api.persons.getMe();
        if (!active) return;
        setEmail(me.email);
        const p = me.profile;
        setValues({
          firstName: me.firstName ?? '',
          lastName: me.lastName ?? '',
          mobile: me.mobile ?? '',
          photoUrl: p?.photoUrl ?? '',
          dateOfBirth: p?.dateOfBirth ?? '',
          gender: p?.gender ?? '',
          nationality: p?.nationality ?? '',
          addressLine: p?.addressLine ?? '',
          suburb: p?.suburb ?? '',
          state: p?.state ?? '',
          postcode: p?.postcode ?? '',
          emergencyName: p?.emergencyName ?? '',
          emergencyPhone: p?.emergencyPhone ?? '',
          headline: p?.headline ?? '',
          about: p?.about ?? '',
          skills: p?.skills ?? '',
          industries: p?.industries ?? '',
          languages: p?.languages ?? '',
          availability: p?.availability ?? '',
          availableDays: p?.availableDays ?? '',
          availableHours: p?.availableHours ?? '',
          hireStatus: p?.hireStatus ?? '',
        });
        setCompleteness(p?.completeness ?? 0);
        setExperiences(me.experiences);
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

  const set =
    (name: keyof Values) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [name]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const profile = await api.persons.updateProfile(values);
      setCompleteness(profile.completeness);
      setSaved(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl">My Profile</h1>
          <p className="mt-0.5 text-sm text-[#64748B]">
            Your personal, professional and availability details — this drives your job matches.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#64748B]">Completeness</div>
          <div className="text-lg font-semibold" style={{ color: 'var(--accent)' }}>
            {completeness}%
          </div>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${completeness}%`, backgroundColor: 'var(--accent)' }}
        />
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {saved ? <Alert tone="success">Profile saved.</Alert> : null}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Personal information */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#1E293B]">Personal information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="firstName" label="First name">
              <Input id="firstName" value={values.firstName} onChange={set('firstName')} />
            </Field>
            <Field id="lastName" label="Last name">
              <Input id="lastName" value={values.lastName} onChange={set('lastName')} />
            </Field>
            <Field id="email" label="Email">
              <Input id="email" value={email} disabled className="bg-[#F8FAFC] text-[#64748B]" />
            </Field>
            <Field id="mobile" label="Mobile">
              <Input id="mobile" value={values.mobile} onChange={set('mobile')} placeholder="04xx xxx xxx" />
            </Field>
            <Field id="dateOfBirth" label="Date of birth">
              <input id="dateOfBirth" type="date" value={values.dateOfBirth} onChange={set('dateOfBirth')} className={inputCls} />
            </Field>
            <Field id="gender" label="Gender">
              <select id="gender" value={values.gender} onChange={set('gender')} className={inputCls}>
                <option value="">Select…</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </Field>
            <Field id="nationality" label="Nationality">
              <Input id="nationality" value={values.nationality} onChange={set('nationality')} />
            </Field>
            <div className="sm:col-span-2">
              <Field id="addressLine" label="Address">
                <Input id="addressLine" value={values.addressLine} onChange={set('addressLine')} />
              </Field>
            </div>
            <Field id="suburb" label="Suburb">
              <Input id="suburb" value={values.suburb} onChange={set('suburb')} />
            </Field>
            <Field id="state" label="State">
              <select id="state" value={values.state} onChange={set('state')} className={inputCls}>
                <option value="">Select…</option>
                {AU_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field id="postcode" label="Postcode">
              <Input id="postcode" value={values.postcode} onChange={set('postcode')} />
            </Field>
            <Field id="emergencyName" label="Emergency contact name">
              <Input id="emergencyName" value={values.emergencyName} onChange={set('emergencyName')} />
            </Field>
            <Field id="emergencyPhone" label="Emergency contact phone">
              <Input id="emergencyPhone" value={values.emergencyPhone} onChange={set('emergencyPhone')} />
            </Field>
          </div>
        </Card>

        {/* Professional information */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#1E293B]">Professional information</h2>
          <div className="grid grid-cols-1 gap-4">
            <Field id="headline" label="Professional headline" hint="e.g. Forklift operator · 5 years warehouse experience">
              <Input id="headline" value={values.headline} onChange={set('headline')} />
            </Field>
            <Field id="about" label="About me">
              <textarea id="about" value={values.about} onChange={set('about')} className={areaCls} placeholder="A short summary about you, your experience and what you're looking for." />
            </Field>
            <Field id="skills" label="Skills" hint="Comma separated">
              <textarea id="skills" value={values.skills} onChange={set('skills')} className={areaCls} placeholder="Forklift licence, RF scanning, pick & pack, team leadership" />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="industries" label="Industries" hint="Comma separated">
                <Input id="industries" value={values.industries} onChange={set('industries')} placeholder="Warehousing, Logistics" />
              </Field>
              <Field id="languages" label="Languages spoken" hint="Comma separated">
                <Input id="languages" value={values.languages} onChange={set('languages')} placeholder="English, Punjabi" />
              </Field>
            </div>
          </div>
        </Card>

        {/* Availability & hire-me */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#1E293B]">Availability &amp; hire-me status</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="availability" label="Availability">
              <select id="availability" value={values.availability} onChange={set('availability')} className={inputCls}>
                <option value="">Select…</option>
                {AVAILABILITY.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </Field>
            <Field id="hireStatus" label="Hire-me status">
              <select id="hireStatus" value={values.hireStatus} onChange={set('hireStatus')} className={inputCls}>
                <option value="">Select…</option>
                {HIRE_STATUS.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </Field>
            <Field id="availableDays" label="Available days">
              <Input id="availableDays" value={values.availableDays} onChange={set('availableDays')} placeholder="Mon–Fri, weekends" />
            </Field>
            <Field id="availableHours" label="Available hours">
              <Input id="availableHours" value={values.availableHours} onChange={set('availableHours')} placeholder="Day shift, night shift, flexible" />
            </Field>
          </div>
        </Card>

        <div className="sticky bottom-0 -mx-1 flex items-center justify-end gap-3 border-t border-[#E5E7EB] bg-white/90 px-1 py-3 backdrop-blur">
          {saved ? <span className="text-sm text-[#16A34A]">Saved</span> : null}
          <Button type="submit" loading={saving}>
            Save profile
          </Button>
        </div>
      </form>

      {/* Employment history (separate child entity) */}
      <EmploymentHistory experiences={experiences} onChange={setExperiences} />
    </div>
  );
}

const EMPTY_EXP: WorkExperienceInput = {
  employer: '',
  position: '',
  employmentType: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  summary: '',
};

function EmploymentHistory({
  experiences,
  onChange,
}: {
  experiences: WorkExperience[];
  onChange: (next: WorkExperience[]) => void;
}) {
  const [form, setForm] = useState<WorkExperienceInput>(EMPTY_EXP);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await api.persons.addExperience(form);
      onChange([created, ...experiences]);
      setForm(EMPTY_EXP);
      setShowForm(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await api.persons.deleteExperience(id);
      onChange(experiences.filter((x) => x.id !== id));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1E293B]">Employment history</h2>
        <Button size="sm" variant="secondary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : 'Add experience'}
        </Button>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      {showForm ? (
        <form onSubmit={add} className="mb-5 grid grid-cols-1 gap-4 rounded-lg border border-[#E5E7EB] p-4 sm:grid-cols-2">
          <Field id="employer" label="Employer">
            <Input id="employer" value={form.employer} onChange={(e) => setForm({ ...form, employer: e.target.value })} />
          </Field>
          <Field id="expPosition" label="Position">
            <Input id="expPosition" value={form.position ?? ''} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          </Field>
          <Field id="expType" label="Employment type">
            <Input id="expType" value={form.employmentType ?? ''} onChange={(e) => setForm({ ...form, employmentType: e.target.value })} placeholder="Casual / Full-time" />
          </Field>
          <Field id="expLocation" label="Location">
            <Input id="expLocation" value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Field id="expStart" label="Start date">
            <input id="expStart" type="date" value={form.startDate ?? ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputCls} />
          </Field>
          <Field id="expEnd" label="End date">
            <input id="expEnd" type="date" value={form.endDate ?? ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputCls} disabled={form.current} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-[#1E293B] sm:col-span-2">
            <input type="checkbox" checked={!!form.current} onChange={(e) => setForm({ ...form, current: e.target.checked })} />
            I currently work here
          </label>
          <div className="sm:col-span-2">
            <Field id="expSummary" label="Summary">
              <textarea id="expSummary" value={form.summary ?? ''} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={areaCls} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" loading={busy}>Add experience</Button>
          </div>
        </form>
      ) : null}

      {experiences.length === 0 ? (
        <p className="text-sm text-[#64748B]">No employment history yet. Add your roles to strengthen your profile.</p>
      ) : (
        <ul className="space-y-3">
          {experiences.map((x) => (
            <li key={x.id} className="flex items-start justify-between gap-4 rounded-lg border border-[#E5E7EB] p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-[#1E293B]">{x.position || 'Role'}</span>
                  <span className="text-[#64748B]">· {x.employer}</span>
                  {x.current ? (
                    <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs text-[#166534]">Current</span>
                  ) : null}
                </div>
                <div className="mt-0.5 text-sm text-[#64748B]">
                  {[x.employmentType, x.location, [x.startDate, x.current ? 'Present' : x.endDate].filter(Boolean).join(' – ')]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </div>
                {x.summary ? <p className="mt-1.5 text-sm text-[#475569]">{x.summary}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => remove(x.id)}
                className="shrink-0 text-sm text-[#DC2626] hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
