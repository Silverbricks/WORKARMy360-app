'use client';

import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import type { OrgProfileUpdate } from '@workarmy/types';
import { Alert, Button, Card, Field, Input } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

const FIELDS: { name: keyof OrgProfileUpdate; label: string; full?: boolean }[] = [
  { name: 'legalName', label: 'Legal entity name', full: true },
  { name: 'tradingName', label: 'Trading name', full: true },
  { name: 'abn', label: 'ABN' },
  { name: 'structure', label: 'Business structure' },
  { name: 'industry', label: 'Primary industry' },
  { name: 'workforceSize', label: 'Workforce size' },
  { name: 'website', label: 'Website', full: true },
  { name: 'about', label: 'About', full: true },
  { name: 'addressLine', label: 'Address', full: true },
  { name: 'suburb', label: 'Suburb' },
  { name: 'state', label: 'State' },
  { name: 'postcode', label: 'Postcode' },
  { name: 'region', label: 'Service regions', full: true },
];

export function OrgProfileSection() {
  const [values, setValues] = useState<OrgProfileUpdate>({});
  const [completeness, setCompleteness] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const org = await api.organisations.getMe();
        if (active && org.profile) {
          const p = org.profile;
          setValues({
            legalName: p.legalName ?? '',
            tradingName: p.tradingName ?? '',
            abn: p.abn ?? '',
            structure: p.structure ?? '',
            industry: p.industry ?? '',
            workforceSize: p.workforceSize ?? '',
            website: p.website ?? '',
            about: p.about ?? '',
            addressLine: p.addressLine ?? '',
            suburb: p.suburb ?? '',
            state: p.state ?? '',
            postcode: p.postcode ?? '',
            region: p.region ?? '',
          });
          setCompleteness(p.completeness);
        }
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

  const update = (name: keyof OrgProfileUpdate) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [name]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const profile = await api.organisations.updateProfile(values);
      setCompleteness(profile.completeness);
      setSaved(true);
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
        <h1 className="text-2xl">Organisation Profile</h1>
        <div className="text-right">
          <div className="text-xs text-[#64748B]">Completeness</div>
          <div className="text-lg font-semibold" style={{ color: 'var(--accent)' }}>
            {completeness}%
          </div>
        </div>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {saved ? <Alert tone="success">Profile saved.</Alert> : null}
      <Card className="p-6">
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.name} className={f.full ? 'sm:col-span-2' : ''}>
              <Field id={f.name} label={f.label}>
                <Input id={f.name} value={(values[f.name] as string) ?? ''} onChange={update(f.name)} />
              </Field>
            </div>
          ))}
          <div className="sm:col-span-2">
            <Button type="submit" loading={saving}>
              Save profile
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
