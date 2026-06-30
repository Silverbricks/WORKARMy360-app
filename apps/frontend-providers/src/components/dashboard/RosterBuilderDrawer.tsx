'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  ConfigCategory,
  ConfigField,
  ConfigGate,
  IndustryTemplateSummary,
  ModuleCatalogEntry,
  ResolvedConfig,
} from '@workarmy/types';
import { Alert, Button, Icon, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

/** Canonical terms a company can relabel (Terminology Builder, v1 subset). */
const TERMS: { key: string; hint: string }[] = [
  { key: 'worker', hint: 'e.g. Picker, Nurse, Guard' },
  { key: 'location', hint: 'e.g. Block, Ward, Site' },
  { key: 'client', hint: 'e.g. Farm, Host, Venue' },
  { key: 'shift', hint: 'e.g. Shift, Placement' },
];

/**
 * The Roster Builder — the v1 face of the Company Builder. Every control writes
 * to the metadata config (api.planner.config.*) and the parent re-renders from
 * the returned ResolvedConfig, so the whole roster re-shapes with no code change.
 */
export function RosterBuilderDrawer({
  config,
  onChange,
  onClose,
}: {
  config: ResolvedConfig | null;
  onChange: (c: ResolvedConfig) => void;
  onClose: () => void;
}) {
  const [catalog, setCatalog] = useState<ModuleCatalogEntry[]>([]);
  const [templates, setTemplates] = useState<IndustryTemplateSummary[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [c, t] = await Promise.all([api.planner.config.catalog(), api.planner.config.templates()]);
        if (active) {
          setCatalog(c);
          setTemplates(t);
        }
      } catch (e) {
        if (active) setError(errorMessage(e));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function run(key: string, fn: () => Promise<ResolvedConfig>) {
    setBusy(key);
    setError(null);
    try {
      onChange(await fn());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const enabled = useMemo(() => new Map((config?.modules ?? []).map((m) => [m.key, m.enabled])), [config]);
  const groups = useMemo(() => {
    const by = new Map<string, ModuleCatalogEntry[]>();
    for (const m of catalog) {
      const list = by.get(m.group) ?? [];
      list.push(m);
      by.set(m.group, list);
    }
    return [...by.entries()];
  }, [catalog]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#E5E7EB] bg-white px-5 py-4">
          <Icon name="settings" size={18} style={{ color: 'var(--accent)' }} />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-[#1E293B]">Roster Builder</h2>
            <p className="text-xs text-[#64748B]">
              {config?.templateKey ? `Template: ${config.templateKey}` : 'No template applied'} · build your own roster
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-xl leading-none text-[#94A3B8] hover:text-[#1E293B]">
            ✕
          </button>
        </header>

        <div className="space-y-7 px-5 py-5">
          {error ? <Alert tone="error">{error}</Alert> : null}

          {/* Industry templates */}
          <Section title="Industry template" hint="Applying one reshapes modules, terminology, colours, gates & shift templates.">
            <div className="grid grid-cols-2 gap-2">
              {templates.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  disabled={busy !== null}
                  onClick={() => run(`tpl:${t.key}`, () => api.planner.config.applyTemplate({ templateKey: t.key }))}
                  className={cn(
                    'rounded-xl border p-3 text-left transition',
                    config?.templateKey === t.key
                      ? 'border-[color:var(--accent)] bg-[#F8FAFC]'
                      : 'border-[#E5E7EB] hover:border-[#CBD5E1]',
                  )}
                >
                  <div className="text-sm font-semibold text-[#1E293B]">
                    {t.emoji ? `${t.emoji} ` : ''}
                    {t.label}
                  </div>
                  <div className="text-[11px] text-[#94A3B8]">{t.moduleCount} modules</div>
                </button>
              ))}
            </div>
          </Section>

          {/* Module marketplace */}
          <Section title="Module marketplace" hint="Switch features on or off. Dependencies turn on automatically.">
            <div className="space-y-4">
              {groups.map(([group, mods]) => (
                <div key={group}>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">{group}</p>
                  <div className="space-y-1">
                    {mods.map((m) => {
                      const on = enabled.get(m.key) ?? false;
                      return (
                        <button
                          key={m.key}
                          type="button"
                          disabled={busy !== null}
                          onClick={() => run(`mod:${m.key}`, () => api.planner.config.toggleModule({ key: m.key, enabled: !on }))}
                          className="flex w-full items-center gap-3 rounded-lg border border-[#E5E7EB] px-3 py-2 text-left hover:bg-[#F8FAFC]"
                          title={m.description}
                        >
                          <Pill on={on} />
                          <span className="flex-1">
                            <span className="block text-sm font-medium text-[#1E293B]">{m.label}</span>
                            <span className="block text-[11px] text-[#94A3B8]">{m.description}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Terminology */}
          <Section title="Terminology" hint="Rename things to match your business — applied across the roster.">
            <div className="space-y-2">
              {TERMS.map((t) => (
                <div key={t.key} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-xs capitalize text-[#64748B]">{t.key}</span>
                  <Input
                    defaultValue={config?.terminology[t.key] ?? ''}
                    placeholder={t.hint}
                    onBlur={(e) => {
                      const label = e.target.value.trim();
                      if (label && label !== (config?.terminology[t.key] ?? '')) {
                        run(`term:${t.key}`, () => api.planner.config.setTerm({ term: t.key, label }));
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </Section>

          {/* Colours / categories */}
          <Section title="Shift colours" hint="The category palette for shift cards.">
            <CategoryEditor categories={config?.categories ?? []} busy={busy} run={run} />
          </Section>

          {/* Compliance gates */}
          <Section title="Compliance gates" hint="Workers with an expired credential of a gated type are flagged.">
            <GateEditor gates={config?.gates ?? []} busy={busy} run={run} />
          </Section>

          {/* Custom fields */}
          <Section title="Custom fields" hint="Extra fields captured on each requirement.">
            <FieldEditor fields={config?.fields ?? []} busy={busy} run={run} />
          </Section>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-[#1E293B]">{title}</h3>
      <p className="mb-2.5 text-[11px] text-[#94A3B8]">{hint}</p>
      {children}
    </section>
  );
}

function Pill({ on }: { on: boolean }) {
  return (
    <span
      className={cn('relative h-5 w-9 shrink-0 rounded-full transition', on ? '' : 'bg-[#CBD5E1]')}
      style={on ? { backgroundColor: 'var(--accent)' } : undefined}
    >
      <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition', on ? 'left-[18px]' : 'left-0.5')} />
    </span>
  );
}

type RunFn = (key: string, fn: () => Promise<ResolvedConfig>) => Promise<void>;

function CategoryEditor({ categories, busy, run }: { categories: ConfigCategory[]; busy: string | null; run: RunFn }) {
  const [draft, setDraft] = useState({ key: '', label: '', color: '#5b7a4f' });
  return (
    <div className="space-y-2">
      {categories.map((c) => (
        <div key={c.key} className="flex items-center gap-2">
          <input
            type="color"
            defaultValue={c.color}
            className="h-7 w-9 cursor-pointer rounded border border-[#E5E7EB]"
            onChange={(e) => run(`cat:${c.key}`, () => api.planner.config.setCategory({ key: c.key, label: c.label, color: e.target.value }))}
          />
          <Input
            defaultValue={c.label}
            className="flex-1"
            onBlur={(e) => {
              const label = e.target.value.trim();
              if (label && label !== c.label) run(`cat:${c.key}`, () => api.planner.config.setCategory({ key: c.key, label, color: c.color }));
            }}
          />
          <button type="button" className="text-[#94A3B8] hover:text-[#B91C1C]" onClick={() => run(`catdel:${c.key}`, () => api.planner.config.removeCategory(c.key))}>
            <Icon name="trash" size={15} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <input type="color" value={draft.color} className="h-7 w-9 cursor-pointer rounded border border-[#E5E7EB]" onChange={(e) => setDraft({ ...draft, color: e.target.value })} />
        <Input value={draft.label} placeholder="New category" className="flex-1" onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
        <Button
          size="sm"
          variant="secondary"
          loading={busy === 'cat:new'}
          onClick={() => {
            const label = draft.label.trim();
            if (!label) return;
            const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
            run('cat:new', () => api.planner.config.setCategory({ key, label, color: draft.color })).then(() => setDraft({ key: '', label: '', color: '#5b7a4f' }));
          }}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

function GateEditor({ gates, busy, run }: { gates: ConfigGate[]; busy: string | null; run: RunFn }) {
  const [draft, setDraft] = useState({ label: '', credentialType: '' });
  return (
    <div className="space-y-2">
      {gates.map((g) => (
        <div key={g.key} className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2">
          <span className="flex-1">
            <span className="block text-sm text-[#1E293B]">{g.label}</span>
            <span className="block font-mono text-[11px] text-[#94A3B8]">{g.credentialType}</span>
          </span>
          <button type="button" className="text-[#94A3B8] hover:text-[#B91C1C]" onClick={() => run(`gatedel:${g.key}`, () => api.planner.config.removeGate(g.key))}>
            <Icon name="trash" size={15} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <Input value={draft.label} placeholder="Gate label" className="flex-1" onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
        <Input value={draft.credentialType} placeholder="credential-type" className="flex-1" onChange={(e) => setDraft({ ...draft, credentialType: e.target.value })} />
        <Button
          size="sm"
          variant="secondary"
          loading={busy === 'gate:new'}
          onClick={() => {
            const label = draft.label.trim();
            const credentialType = draft.credentialType.trim();
            if (!label || !credentialType) return;
            const key = credentialType.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
            run('gate:new', () => api.planner.config.setGate({ key, label, credentialType })).then(() => setDraft({ label: '', credentialType: '' }));
          }}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

const FIELD_TYPES = ['text', 'number', 'date', 'dropdown', 'checkbox', 'currency'] as const;

function FieldEditor({ fields, busy, run }: { fields: ConfigField[]; busy: string | null; run: RunFn }) {
  const [draft, setDraft] = useState<{ label: string; type: (typeof FIELD_TYPES)[number] }>({ label: '', type: 'text' });
  return (
    <div className="space-y-2">
      {fields.map((f) => (
        <div key={f.key} className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2">
          <span className="flex-1 text-sm text-[#1E293B]">{f.label}</span>
          <span className="rounded bg-[#F1F5F9] px-2 py-0.5 text-[11px] text-[#64748B]">{f.type}</span>
          <button type="button" className="text-[#94A3B8] hover:text-[#B91C1C]" onClick={() => run(`flddel:${f.key}`, () => api.planner.config.removeField(f.key))}>
            <Icon name="trash" size={15} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <Input value={draft.label} placeholder="New field label" className="flex-1" onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
        <select
          value={draft.type}
          onChange={(e) => setDraft({ ...draft, type: e.target.value as (typeof FIELD_TYPES)[number] })}
          className="rounded-lg border border-[#E5E7EB] px-2 py-2 text-sm text-[#1E293B]"
        >
          {FIELD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="secondary"
          loading={busy === 'fld:new'}
          onClick={() => {
            const label = draft.label.trim();
            if (!label) return;
            const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
            run('fld:new', () => api.planner.config.setField({ key, label, type: draft.type })).then(() => setDraft({ label: '', type: 'text' }));
          }}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
