'use client';

import { useEffect, useState } from 'react';
import type { AvailabilityCard, DocumentView } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input, cn } from '@workarmy/ui';
import { api, fileDownloadUrl } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { useMe } from './DashboardShell';
import { FileUploadButton } from './FileUploadButton';

const WORK_TYPES = ['any', 'hourly', 'weekly', 'contract'] as const;
const CONTACT = [
  { v: 'in_app', label: 'In-app message' },
  { v: 'phone', label: 'Phone call' },
  { v: 'email', label: 'Email' },
] as const;

const selectCls =
  'h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--accent)]';

export function GetJobFasterSection() {
  const me = useMe();
  const name = `${me?.person?.firstName ?? ''} ${me?.person?.lastName ?? ''}`.trim() || 'Job Seeker';
  const initials =
    `${me?.person?.firstName?.[0] ?? ''}${me?.person?.lastName?.[0] ?? ''}`.toUpperCase() || 'WA';

  const [card, setCard] = useState<AvailabilityCard | null>(null);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    api.persons
      .getAvailabilityCard()
      .then((c) => {
        if (!active) return;
        setCard(c);
        setPhotoId(c.photoDocumentId);
      })
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  function set<K extends keyof AvailabilityCard>(key: K, value: AvailabilityCard[K]) {
    setCard((c) => (c ? { ...c, [key]: value } : c));
    setSaved(false);
  }

  async function onPhoto(doc: DocumentView) {
    try {
      await api.persons.setPhoto(doc.id);
      setPhotoId(doc.id);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function save(publishOverride?: boolean) {
    if (!card) return;
    setBusy(true);
    setError(null);
    try {
      const next = await api.persons.updateAvailabilityCard({
        qualification: card.qualification ?? '',
        suburb: card.suburb ?? '',
        state: card.state ?? '',
        availability: card.availability ?? '',
        workType: card.workType ?? 'any',
        availableFrom: card.availableFrom ?? 'ASAP',
        urgentShifts: card.urgentShifts,
        willingToRelocate: card.willingToRelocate,
        preferredIndustries: card.preferredIndustries ?? '',
        contactPreference: card.contactPreference ?? 'in_app',
        published: publishOverride ?? card.published,
      });
      setCard({ ...next, photoDocumentId: photoId });
      setSaved(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading || !card) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  const asap = card.availableFrom === 'ASAP' || !card.availableFrom;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">⚡ Get Job Faster</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">
          Build a quick availability card. Employers searching for workers like you find it instantly.
        </p>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {saved ? <Alert tone="success">Saved.</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-[#1E293B]">Photo &amp; basics</h2>
            <div className="mb-4 flex items-center gap-4">
              {photoId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileDownloadUrl(photoId)} alt={name} className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <span
                  className="grid h-16 w-16 place-items-center rounded-xl text-lg font-semibold text-white"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {initials}
                </span>
              )}
              <FileUploadButton kind="OTHER" label={photoId ? 'Change photo' : 'Upload photo'} onUploaded={onPhoto} />
            </div>
            <Field id="qual" label="Qualification (optional)">
              <Input
                id="qual"
                value={card.qualification ?? ''}
                onChange={(e) => set('qualification', e.target.value)}
                placeholder="e.g. Cert III Individual Support"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="suburb" label="Suburb">
                <Input id="suburb" value={card.suburb ?? ''} onChange={(e) => set('suburb', e.target.value)} placeholder="Cranbourne" />
              </Field>
              <Field id="state" label="State">
                <Input id="state" value={card.state ?? ''} onChange={(e) => set('state', e.target.value)} placeholder="VIC" />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-[#1E293B]">Availability</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="availability" label="Type">
                <select
                  id="availability"
                  className={selectCls}
                  value={card.availability ?? ''}
                  onChange={(e) => set('availability', e.target.value)}
                >
                  <option value="">Select…</option>
                  {['Full-time', 'Part-time', 'Casual', 'On-call', 'Seasonal'].map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="workType" label="Type of work">
                <select
                  id="workType"
                  className={selectCls}
                  value={card.workType ?? 'any'}
                  onChange={(e) => set('workType', e.target.value)}
                >
                  {WORK_TYPES.map((o) => (
                    <option key={o} value={o}>
                      {o[0].toUpperCase() + o.slice(1)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-1">
              <p className="mb-1.5 text-sm font-medium text-[#1E293B]">Available from</p>
              <div className="flex flex-wrap items-center gap-2">
                <Pill active={asap} onClick={() => set('availableFrom', 'ASAP')}>
                  ASAP
                </Pill>
                <Pill active={!asap} onClick={() => set('availableFrom', new Date().toISOString().slice(0, 10))}>
                  From a date
                </Pill>
                {!asap ? (
                  <input
                    type="date"
                    className="h-9 rounded-lg border border-[#E5E7EB] px-2 text-sm"
                    value={card.availableFrom ?? ''}
                    onChange={(e) => set('availableFrom', e.target.value)}
                  />
                ) : null}
              </div>
            </div>
            <Toggle
              className="mt-3"
              label="Available for urgent shifts nearby"
              checked={card.urgentShifts}
              onChange={(v) => set('urgentShifts', v)}
            />
            <Toggle
              label="Willing to relocate"
              checked={card.willingToRelocate}
              onChange={(v) => set('willingToRelocate', v)}
            />
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-[#1E293B]">Preferences &amp; contact</h2>
            <Field id="prefInd" label="Preferred industries (comma-separated)">
              <Input
                id="prefInd"
                value={card.preferredIndustries ?? ''}
                onChange={(e) => set('preferredIndustries', e.target.value)}
                placeholder="Farm & Horticulture, Warehouse"
              />
            </Field>
            <Field id="contact" label="How employers reach you">
              <select
                id="contact"
                className={selectCls}
                value={card.contactPreference ?? 'in_app'}
                onChange={(e) => set('contactPreference', e.target.value)}
              >
                {CONTACT.map((c) => (
                  <option key={c.v} value={c.v}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </Card>
        </div>

        {/* Live preview */}
        <div>
          <Card className="sticky top-20 p-5">
            <h2 className="mb-3 text-sm font-semibold text-[#1E293B]">Live preview</h2>
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
              <div className="flex items-center gap-3">
                {photoId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fileDownloadUrl(photoId)} alt={name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span
                    className="grid h-12 w-12 place-items-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    {initials}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-[#1E293B]">{name}</p>
                  <p className="truncate text-xs text-[#64748B]">{card.qualification || 'Job Seeker'}</p>
                </div>
                <span
                  className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ backgroundColor: asap ? '#DCFCE7' : '#FEF9C3', color: asap ? '#166534' : '#854D0E' }}
                >
                  {asap ? 'ASAP' : 'Soon'}
                </span>
              </div>
              {card.urgentShifts ? (
                <div className="mt-3 rounded-md bg-[#FEF9C3] px-2 py-1 text-center text-[11px] font-semibold text-[#854D0E]">
                  ⚡ Available for urgent shifts nearby
                </div>
              ) : null}
              <dl className="mt-3 space-y-1 text-xs text-[#64748B]">
                <div>📍 {[card.suburb, card.state].filter(Boolean).join(', ') || '—'}</div>
                <div>🕐 {card.availability || 'Set availability'} · {card.workType || 'any'}</div>
                <div>✈️ Relocate: {card.willingToRelocate ? 'Yes' : 'No'}</div>
                <div>🎯 {card.preferredIndustries || 'Open to any work'}</div>
              </dl>
            </div>

            <Toggle
              className="mt-4"
              label="Publish my card"
              desc="Show to employers searching for workers"
              checked={card.published}
              onChange={(v) => {
                set('published', v);
                void save(v);
              }}
            />
            <Button fullWidth className="mt-3" loading={busy} onClick={() => save()}>
              <Icon name="check" size={16} /> Save changes
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-sm font-medium transition',
        active ? 'text-white' : 'bg-[#F1F5F9] text-[#64748B]',
      )}
      style={active ? { backgroundColor: 'var(--accent)' } : undefined}
    >
      {children}
    </button>
  );
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
  className,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 py-2', className)}>
      <div>
        <p className="text-sm font-medium text-[#1E293B]">{label}</p>
        {desc ? <p className="text-xs text-[#94A3B8]">{desc}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn('inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition', !checked && 'bg-[#CBD5E1]')}
        style={checked ? { backgroundColor: 'var(--accent)' } : undefined}
        aria-pressed={checked}
      >
        <span className={cn('h-5 w-5 rounded-full bg-white transition', checked ? 'translate-x-5' : 'translate-x-0')} />
      </button>
    </div>
  );
}
