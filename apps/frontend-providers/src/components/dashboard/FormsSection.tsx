'use client';

import { useEffect, useState } from 'react';
import type { FormDefinition, FormFieldDef, FormFieldType, FormSubmissionView } from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

const CATEGORIES = ['general', 'Inspection', 'Incident', 'Checklist', 'Report', 'Risk Assessment'];
const FIELD_TYPES: FormFieldType[] = ['text', 'textarea', 'number', 'date', 'dropdown', 'checkbox', 'currency'];
const statusTone: Record<string, string> = {
  DRAFT: 'bg-[#F1F5F9] text-[#64748B]',
  PUBLISHED: 'bg-[#DCFCE7] text-[#166534]',
  ARCHIVED: 'bg-[#FEF3C7] text-[#92400E]',
};
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || `f${Date.now() % 100000}`;

export function FormsSection() {
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<FormDefinition | 'new' | null>(null);
  const [filling, setFilling] = useState<FormDefinition | null>(null);
  const [subsFor, setSubsFor] = useState<FormDefinition | null>(null);

  async function load() {
    setForms(await api.forms.list());
  }
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await load();
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

  async function act(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl">Forms</h1>
          <p className="text-xs text-[#64748B]">Build inspections, incident reports, checklists — then capture submissions.</p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing('new')}>
            <Icon name="clipboard" size={16} /> New form
          </Button>
        ) : null}
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      {editing ? (
        <FormBuilder
          form={editing === 'new' ? null : editing}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
          onCancel={() => setEditing(null)}
        />
      ) : forms.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#94A3B8]">No forms yet. Create one to start capturing structured data.</Card>
      ) : (
        <div className="space-y-3">
          {forms.map((f) => (
            <Card key={f.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-medium text-[#1E293B]">
                    {f.name}
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', statusTone[f.status])}>{f.status}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    {f.category} · {f.fields.length} field{f.fields.length === 1 ? '' : 's'} · {f.submissionCount} submission{f.submissionCount === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {f.status === 'PUBLISHED' ? (
                    <Button size="sm" onClick={() => setFilling(f)}>
                      Fill
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => act(() => api.forms.publish(f.id))}>
                      Publish
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => setSubsFor(f)}>
                    Submissions
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(f)}>
                    Edit
                  </Button>
                  <button type="button" aria-label="Delete" className="text-[#94A3B8] hover:text-[#B91C1C]" onClick={() => act(() => api.forms.remove(f.id))}>
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filling ? <FormFillDrawer form={filling} onClose={() => setFilling(null)} onSubmitted={() => { setFilling(null); void load(); }} /> : null}
      {subsFor ? <SubmissionsDrawer form={subsFor} onClose={() => setSubsFor(null)} /> : null}
    </div>
  );
}

function FormBuilder({ form, onSaved, onCancel }: { form: FormDefinition | null; onSaved: () => void; onCancel: () => void }) {
  const [name, setName] = useState(form?.name ?? '');
  const [category, setCategory] = useState(form?.category ?? 'general');
  const [description, setDescription] = useState(form?.description ?? '');
  const [fields, setFields] = useState<FormFieldDef[]>(form?.fields ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addField() {
    setFields((f) => [...f, { key: '', label: '', type: 'text', required: false }]);
  }
  function patch(i: number, p: Partial<FormFieldDef>) {
    setFields((f) => f.map((x, idx) => (idx === i ? { ...x, ...p } : x)));
  }

  async function save() {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    const prepared: FormFieldDef[] = fields
      .filter((f) => f.label.trim())
      .map((f) => ({
        key: f.key || slug(f.label),
        label: f.label.trim(),
        type: f.type,
        required: f.required || undefined,
        options: f.type === 'dropdown' ? (f.options ?? []).map((o) => o.trim()).filter(Boolean) : undefined,
      }));
    setBusy(true);
    setError(null);
    try {
      const body = { name: name.trim(), category, description: description.trim() || undefined, fields: prepared };
      if (form) await api.forms.update(form.id, body);
      else await api.forms.create(body);
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1E293B]">{form ? 'Edit form' : 'New form'}</h2>
        <button type="button" onClick={onCancel} aria-label="Close" className="text-xl leading-none text-[#94A3B8] hover:text-[#1E293B]">
          ✕
        </button>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="fName" label="Form name">
          <Input id="fName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Daily Site Inspection" />
        </Field>
        <Field id="fCat" label="Category">
          <select id="fCat" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#1E293B]">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="fDesc" label="Description (optional)">
        <Input id="fDesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this form for?" />
      </Field>

      <div>
        <p className="mb-2 text-sm font-semibold text-[#1E293B]">Fields</p>
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={i} className="rounded-lg border border-[#E5E7EB] p-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Input value={f.label} onChange={(e) => patch(i, { label: e.target.value })} placeholder="Field label" className="flex-1" />
                <select value={f.type} onChange={(e) => patch(i, { type: e.target.value as FormFieldType })} className="rounded-lg border border-[#E5E7EB] px-2 py-2 text-sm">
                  {FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-xs text-[#64748B]">
                  <input type="checkbox" checked={!!f.required} onChange={(e) => patch(i, { required: e.target.checked })} className="h-4 w-4 accent-[color:var(--accent)]" />
                  Required
                </label>
                <button type="button" aria-label="Remove field" className="text-[#94A3B8] hover:text-[#B91C1C]" onClick={() => setFields((fs) => fs.filter((_, idx) => idx !== i))}>
                  <Icon name="trash" size={15} />
                </button>
              </div>
              {f.type === 'dropdown' ? (
                <Input value={(f.options ?? []).join(', ')} onChange={(e) => patch(i, { options: e.target.value.split(',') })} placeholder="Options, comma-separated" className="mt-2" />
              ) : null}
            </div>
          ))}
        </div>
        <Button size="sm" variant="secondary" className="mt-2" onClick={addField}>
          + Add field
        </Button>
      </div>

      <div className="flex gap-2">
        <Button loading={busy} onClick={save}>
          {form ? 'Save changes' : 'Create form'}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

function FormFillDrawer({ form, onClose, onSubmitted }: { form: FormDefinition; onClose: () => void; onSubmitted: () => void }) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [contextLabel, setContextLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: unknown) => setValues((s) => ({ ...s, [k]: v }));

  async function submit() {
    const missing = form.fields.find((f) => f.required && (values[f.key] === undefined || values[f.key] === '' || values[f.key] === false));
    if (missing) {
      setError(`"${missing.label}" is required.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.forms.submit(form.id, { data: values, contextLabel: contextLabel.trim() || undefined });
      onSubmitted();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer title={form.name} onClose={onClose}>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Field id="ctx" label="Reference (optional)">
        <Input id="ctx" value={contextLabel} onChange={(e) => setContextLabel(e.target.value)} placeholder="e.g. Block A · 1 Jul" />
      </Field>
      {form.fields.map((f) => (
        <Field key={f.key} id={f.key} label={f.label + (f.required ? ' *' : '')}>
          {f.type === 'textarea' ? (
            <textarea id={f.key} value={(values[f.key] as string) ?? ''} onChange={(e) => set(f.key, e.target.value)} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" rows={3} />
          ) : f.type === 'dropdown' ? (
            <select id={f.key} value={(values[f.key] as string) ?? ''} onChange={(e) => set(f.key, e.target.value)} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
              <option value="">Select…</option>
              {(f.options ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : f.type === 'checkbox' ? (
            <label className="flex items-center gap-2 text-sm text-[#1E293B]">
              <input type="checkbox" checked={!!values[f.key]} onChange={(e) => set(f.key, e.target.checked)} className="h-4 w-4 accent-[color:var(--accent)]" /> Yes
            </label>
          ) : (
            <Input
              id={f.key}
              type={f.type === 'number' || f.type === 'currency' ? 'number' : f.type === 'date' ? 'date' : 'text'}
              value={(values[f.key] as string) ?? ''}
              onChange={(e) => set(f.key, e.target.value)}
            />
          )}
        </Field>
      ))}
      <Button loading={busy} onClick={submit}>
        Submit
      </Button>
    </Drawer>
  );
}

function SubmissionsDrawer({ form, onClose }: { form: FormDefinition; onClose: () => void }) {
  const [subs, setSubs] = useState<FormSubmissionView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.forms
      .submissions(form.id)
      .then((s) => active && setSubs(s))
      .catch((e) => active && setError(errorMessage(e)));
    return () => {
      active = false;
    };
  }, [form.id]);

  return (
    <Drawer title={`${form.name} · submissions`} onClose={onClose}>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {subs === null ? (
        <div className="py-8 text-center text-sm text-[#64748B]">Loading…</div>
      ) : subs.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#94A3B8]">No submissions yet.</div>
      ) : (
        subs.map((s) => (
          <Card key={s.id} className="p-3">
            <p className="text-xs text-[#64748B]">
              {s.submitterName ?? 'Someone'}
              {s.contextLabel ? ` · ${s.contextLabel}` : ''} · {new Date(s.createdAt).toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="mt-1.5 space-y-0.5 text-sm">
              {form.fields.map((f) => (
                <p key={f.key}>
                  <span className="text-[#64748B]">{f.label}:</span> {String(s.data[f.key] ?? '—')}
                </p>
              ))}
            </div>
          </Card>
        ))
      )}
    </Drawer>
  );
}

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
        <header className="sticky top-0 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-5 py-4">
          <h2 className="text-lg font-semibold text-[#1E293B]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-xl leading-none text-[#94A3B8] hover:text-[#1E293B]">
            ✕
          </button>
        </header>
        <div className="space-y-3 px-5 py-4">{children}</div>
      </aside>
    </div>
  );
}
