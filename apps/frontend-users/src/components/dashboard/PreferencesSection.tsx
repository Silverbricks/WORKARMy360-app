'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { type PersonPreferencesUpdate, USER_TYPES } from '@workarmy/types';
import { Alert, Button, Card, Field, Input } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

const INDUSTRIES = [
  'Agriculture',
  'Warehousing',
  'Hospitality',
  'Healthcare',
  'Construction',
  'Logistics',
  'Retail',
  'Manufacturing',
  'Aged Care',
  'Cleaning',
];
const JOB_TYPES = [
  'Farm work',
  'Warehouse',
  'Pick & pack',
  'Support work',
  'Healthcare',
  'Hospitality',
  'Construction',
  'Trades',
  'General labour',
  'Driving',
];
const CATEGORIES = [
  'Job-ready worker',
  'Skilled / professional',
  'Farm / labourer / trade',
  'Healthcare / hospitality',
  'Warehouse / logistics',
  'Backpacker',
  'Apprentice / trainee',
  'Volunteer',
  'Other',
];

const inputCls =
  'h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]';

function splitCsv(v: string | null | undefined): string[] {
  return v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

function Chips({
  options,
  value,
  onChange,
  max,
}: {
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  function toggle(opt: string) {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else if (!max || value.length < max) {
      onChange([...value, opt]);
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className="rounded-full border px-3 py-1 text-sm transition"
            style={
              on
                ? { backgroundColor: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
                : { borderColor: '#E5E7EB', color: '#1E293B' }
            }
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function PreferencesSection() {
  const [userTypes, setUserTypes] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>(['', '', '']);
  const [category, setCategory] = useState('');
  const [payMin, setPayMin] = useState('');
  const [relocate, setRelocate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const p = await api.persons.getPreferences();
        if (!active) return;
        setUserTypes(splitCsv(p.userTypes));
        setIndustries(splitCsv(p.preferredIndustries));
        setJobTypes(splitCsv(p.preferredJobTypes));
        const locs = splitCsv(p.preferredLocations);
        setLocations([locs[0] ?? '', locs[1] ?? '', locs[2] ?? '']);
        setCategory(p.seekerCategory ?? '');
        setPayMin(p.preferredPayMin != null ? String(p.preferredPayMin) : '');
        setRelocate(p.willingToRelocate);
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    const body: PersonPreferencesUpdate = {
      seekerCategory: category,
      userTypes: userTypes.join(','),
      preferredIndustries: industries.join(','),
      preferredJobTypes: jobTypes.join(','),
      preferredLocations: locations.map((s) => s.trim()).filter(Boolean).join(','),
      willingToRelocate: relocate,
      preferredPayMin: payMin ? Number(payMin) : undefined,
    };
    try {
      await api.persons.updatePreferences(body);
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
      <div>
        <h1 className="text-2xl">Job Preferences</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">
          Tell us what and where you want to work — this drives your job matches.
        </p>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {saved ? <Alert tone="success">Preferences saved.</Alert> : null}

      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-1 text-lg font-semibold text-[#1E293B]">I identify as</h2>
          <p className="mb-3 text-sm text-[#64748B]">Select all that apply.</p>
          <Chips options={USER_TYPES} value={userTypes} onChange={setUserTypes} />
          <div className="mt-5">
            <Field id="category" label="Job seeker category">
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                <option value="">Select…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 text-lg font-semibold text-[#1E293B]">Preferred industries</h2>
          <Chips options={INDUSTRIES} value={industries} onChange={setIndustries} />
          <h2 className="mb-3 mt-6 text-lg font-semibold text-[#1E293B]">Preferred job types</h2>
          <Chips options={JOB_TYPES} value={jobTypes} onChange={setJobTypes} />
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 text-lg font-semibold text-[#1E293B]">Where &amp; how much</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Field key={i} id={`loc${i}`} label={`Preferred location ${i + 1}`}>
                <Input
                  id={`loc${i}`}
                  value={locations[i]}
                  onChange={(e) => setLocations((v) => v.map((x, idx) => (idx === i ? e.target.value : x)))}
                  placeholder="Suburb or city"
                />
              </Field>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="payMin" label="Minimum pay ($/hour)">
              <Input id="payMin" type="number" inputMode="numeric" value={payMin} onChange={(e) => setPayMin(e.target.value)} placeholder="e.g. 30" />
            </Field>
            <label className="flex items-center gap-2 self-end pb-3 text-sm text-[#1E293B]">
              <input type="checkbox" checked={relocate} onChange={(e) => setRelocate(e.target.checked)} />
              I'm willing to relocate for work
            </label>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          {saved ? <span className="text-sm text-[#16A34A]">Saved</span> : null}
          <Button type="submit" loading={saving}>Save preferences</Button>
        </div>
      </form>
    </div>
  );
}
