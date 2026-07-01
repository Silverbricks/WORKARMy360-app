'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type {
  OpenShift,
  PlannerSummary,
  ResolvedConfig,
  RosterSource,
  RosterTemplateView,
  RosterWeek,
  StaffingRequirementView,
  WeatherDay,
  WhosTurningUpDay,
} from '@workarmy/types';
import { Alert, Button, Card, Field, Icon, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';
import { RosterBuilderDrawer } from './RosterBuilderDrawer';
import { RequirementAssignDrawer } from './RequirementAssignDrawer';
import { RosterShiftPanel } from './RosterShiftPanel';
import { RosterDemandTab } from './RosterDemandTab';
import { RosterClientsTab } from './RosterClientsTab';
import { RosterStaffTab } from './RosterStaffTab';

type Tab = 'planner' | 'grid' | 'demand' | 'clients' | 'staff' | 'turnup';

const respTone: Record<string, string> = {
  ACCEPTED: 'bg-[#DCFCE7] text-[#166534]',
  CONFIRMED: 'bg-[#DCFCE7] text-[#166534]',
  COMPLETED: 'bg-[#DCFCE7] text-[#166534]',
  DECLINED: 'bg-[#FEF3C7] text-[#92400E]',
  NO_SHOW: 'bg-[#FEE2E2] text-[#991B1B]',
  ASSIGNED: 'bg-[#F1F5F9] text-[#64748B]',
};
const sourceTone: Record<RosterSource, string> = {
  COMPANY: 'bg-[#ECFDF5] text-[#047857]',
  CONTRACTOR: 'bg-[#EFF6FF] text-[#1D4ED8]',
  AGENCY: 'bg-[#FFF7ED] text-[#C2410C]',
  SOLE_TRADER: 'bg-[#F5F3FF] text-[#6D28D9]',
  NEARBY: 'bg-[#FDF2F8] text-[#BE185D]',
};
const sourceLabel: Record<RosterSource, string> = {
  COMPANY: 'Company',
  CONTRACTOR: 'Contractor',
  AGENCY: 'Agency',
  SOLE_TRADER: 'Sole trader',
  NEARBY: 'Nearby',
};

const TABS: { key: Tab; label: string }[] = [
  { key: 'planner', label: 'Planner' },
  { key: 'grid', label: 'Grid' },
  { key: 'demand', label: 'Demand' },
  { key: 'clients', label: 'Clients' },
  { key: 'staff', label: 'Staff' },
  { key: 'turnup', label: "Who's Turning Up" },
];
const TAB_KEYS: Tab[] = ['planner', 'grid', 'demand', 'clients', 'staff', 'turnup'];

function dayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}
function nextDay(iso: string): string {
  return addDaysISO(iso, 1);
}
function addDaysISO(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function mondayOfToday(): string {
  const d = new Date();
  const u = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  u.setUTCDate(u.getUTCDate() - ((u.getUTCDay() + 6) % 7));
  return u.toISOString().slice(0, 10);
}
function dShort(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' });
}

export function RosterSection() {
  const tabParam = useSearchParams().get('tab');
  const initial: Tab = (TAB_KEYS as string[]).includes(tabParam ?? '') ? (tabParam as Tab) : 'planner';
  const [tab, setTab] = useState<Tab>(initial);
  const [config, setConfig] = useState<ResolvedConfig | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);

  useEffect(() => {
    let active = true;
    api.planner.config
      .get()
      .then((c) => active && setConfig(c))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl">Roster</h1>
          <p className="text-xs text-[#64748B]">
            {config?.templateKey ? `${config.templateKey} workspace` : 'Plan staffing demand, then fill it'}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setBuilderOpen(true)}>
          <Icon name="settings" size={16} /> Roster Builder
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn('rounded-lg px-3 py-1.5 text-sm font-medium', tab === t.key ? 'text-white' : 'bg-[#F1F5F9] text-[#64748B]')}
            style={tab === t.key ? { backgroundColor: 'var(--accent)' } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'planner' ? <PlannerTab config={config} /> : null}
      {tab === 'grid' ? <GridTab config={config} /> : null}
      {tab === 'demand' ? <RosterDemandTab config={config} /> : null}
      {tab === 'clients' ? <RosterClientsTab config={config} /> : null}
      {tab === 'staff' ? <RosterStaffTab /> : null}
      {tab === 'turnup' ? <TurnUpTab /> : null}

      {builderOpen ? <RosterBuilderDrawer config={config} onChange={setConfig} onClose={() => setBuilderOpen(false)} /> : null}
    </div>
  );
}

function PlannerTab({ config }: { config: ResolvedConfig | null }) {
  const [reqs, setReqs] = useState<StaffingRequirementView[]>([]);
  const [summary, setSummary] = useState<PlannerSummary | null>(null);
  const [openShifts, setOpenShifts] = useState<OpenShift[]>([]);
  const [templates, setTemplates] = useState<RosterTemplateView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fillingAll, setFillingAll] = useState(false);
  const [assignReq, setAssignReq] = useState<StaffingRequirementView | null>(null);
  const [form, setForm] = useState({
    date: '',
    startTime: '06:00',
    endTime: '14:00',
    role: '',
    category: '',
    locationText: '',
    client: '',
    requiredCount: 1,
  });

  const locLabel = config?.terminology.location ?? 'Location';
  const clientLabel = config?.terminology.client ?? 'Client';
  const marketplaceOn = !!config?.modules.find((m) => m.key === 'marketplace' && m.enabled);

  async function load() {
    const [r, s, o, t] = await Promise.all([
      api.planner.requirements.list(),
      api.planner.summary(),
      api.planner.openShifts(),
      api.planner.templates.list(),
    ]);
    setReqs(r);
    setSummary(s);
    setOpenShifts(o);
    setTemplates(t);
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

  async function fillAll() {
    setFillingAll(true);
    setError(null);
    try {
      for (const r of reqs) if (r.vacant > 0) await api.planner.requirements.autoFill(r.id);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setFillingAll(false);
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!form.role.trim() || !form.date) {
      setError('Enter a role and date.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.planner.requirements.create({
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        role: form.role,
        category: form.category || config?.categories[0]?.key || 'general',
        locationText: form.locationText || undefined,
        client: form.client || undefined,
        requiredCount: Number(form.requiredCount) || 1,
      });
      setForm({ ...form, role: '', locationText: '', client: '', requiredCount: 1 });
      await load();
    } catch (e2) {
      setError(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  }

  const byDate = useMemo(() => {
    const m = new Map<string, StaffingRequirementView[]>();
    for (const r of reqs) {
      const list = m.get(r.date) ?? [];
      list.push(r);
      m.set(r.date, list);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [reqs]);

  const catColor = (key: string) => config?.categories.find((c) => c.key === key)?.color ?? '#64748B';

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;

  return (
    <div className="space-y-5">
      {error ? <Alert tone="error">{error}</Alert> : null}

      {summary ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <Stat label="Required" value={summary.required} />
          <Stat label="Assigned" value={summary.assigned} tone="ok" />
          <Stat label="Vacant" value={summary.vacant} tone={summary.vacant > 0 ? 'bad' : 'ok'} />
          <Stat label="Available" value={summary.available} />
          <Stat label="On leave" value={summary.leave} />
          <Stat label="Hours" value={`${summary.hours}h`} />
        </div>
      ) : null}

      {summary && summary.vacant > 0 ? (
        <Card className="flex flex-wrap items-center gap-3 border-l-4 p-4" style={{ borderLeftColor: 'var(--accent)' }}>
          <span className="text-xl">🤖</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#1E293B]">AI recommendation</p>
            <p className="text-xs text-[#64748B]">
              {summary.vacant} vacanc{summary.vacant === 1 ? 'y' : 'ies'} · {summary.available} workers available
              {summary.overtime > 0 ? ` · ${summary.overtime}h potential overtime` : ''}
            </p>
          </div>
          <Button loading={fillingAll} onClick={fillAll}>
            🤖 Fill Automatically
          </Button>
        </Card>
      ) : null}

      <Card className="p-5">
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <Field id="reqRole" label="Role / what you need">
            <Input id="reqRole" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Fruit Pickers" />
          </Field>
          <Field id="reqCat" label="Category">
            <select
              id="reqCat"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#1E293B]"
            >
              <option value="">{config?.categories[0]?.label ?? 'General'}</option>
              {(config?.categories ?? []).map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="reqDate" label="Date">
            <Input id="reqDate" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field id="reqCount" label="How many">
            <Input id="reqCount" type="number" min={1} value={form.requiredCount} onChange={(e) => setForm({ ...form, requiredCount: Number(e.target.value) })} />
          </Field>
          <Field id="reqStart" label="Start">
            <Input id="reqStart" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          </Field>
          <Field id="reqEnd" label="Finish">
            <Input id="reqEnd" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </Field>
          <Field id="reqLoc" label={locLabel}>
            <Input id="reqLoc" value={form.locationText} onChange={(e) => setForm({ ...form, locationText: e.target.value })} placeholder={`e.g. ${locLabel} A`} />
          </Field>
          <Field id="reqClient" label={clientLabel}>
            <Input id="reqClient" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
          </Field>
          <div className="flex flex-wrap gap-2 lg:col-span-4">
            <Button type="submit" loading={busy}>
              + Create staffing requirement
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                act(async () => {
                  if (!form.role.trim()) {
                    setError('Enter a role to save as a template.');
                    return;
                  }
                  await api.planner.templates.create({
                    name: form.role,
                    role: form.role,
                    category: form.category || config?.categories[0]?.key,
                    startTime: form.startTime,
                    endTime: form.endTime,
                    requiredCount: Number(form.requiredCount) || 1,
                  });
                })
              }
            >
              Save as template
            </Button>
          </div>
        </form>
      </Card>

      {templates.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#64748B]">Templates:</span>
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                act(async () => {
                  if (!form.date) {
                    setError('Pick a date in the form first.');
                    return;
                  }
                  await api.planner.requirements.fromTemplate({ templateId: t.id, date: form.date });
                })
              }
              className="rounded-full border border-[#E5E7EB] px-2.5 py-1 text-xs text-[#1E293B] hover:border-[color:var(--accent)]"
              title={`${t.startTime ?? ''}–${t.endTime ?? ''}`}
            >
              + {t.name}
            </button>
          ))}
        </div>
      ) : null}

      {byDate.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[#94A3B8]">
          No demand yet. Create a staffing requirement above — say how many you need, then fill it.
        </Card>
      ) : (
        byDate.map(([date, dayReqs]) => (
          <div key={date} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#1E293B]">{dayLabel(date)}</p>
              <button
                type="button"
                onClick={() => act(() => api.planner.requirements.copy({ fromDate: date, toDate: nextDay(date) }))}
                className="text-xs font-medium"
                style={{ color: 'var(--accent)' }}
              >
                ⧉ Duplicate day
              </button>
            </div>
            {dayReqs.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: catColor(r.category) }} />
                    <div>
                      <p className="font-medium text-[#1E293B]">{r.role}</p>
                      <p className="text-xs text-[#64748B]">
                        {r.startTime}–{r.endTime}
                        {r.locationText ? ` · ${r.locationText}` : ''}
                        {r.client ? ` · ${r.client}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        r.vacant > 0 ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#DCFCE7] text-[#166534]',
                      )}
                    >
                      {r.assigned}/{r.requiredCount} {r.vacant > 0 ? `· ${r.vacant} vacant` : '· filled'}
                    </span>
                    {r.vacant > 0 ? (
                      <Button size="sm" variant="ghost" onClick={() => act(() => api.planner.requirements.autoFill(r.id))}>
                        🤖 Fill {r.vacant}
                      </Button>
                    ) : null}
                    <Button size="sm" onClick={() => setAssignReq(r)}>
                      Assign staff
                    </Button>
                    {r.status === 'PUBLISHED' ? (
                      <>
                        <span className="self-center rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-medium text-[#166534]">Published</span>
                        {r.vacant > 0 && marketplaceOn ? (
                          <Button size="sm" variant="ghost" onClick={() => act(() => api.planner.requirements.cascade(r.id))}>
                            📡 Cascade
                          </Button>
                        ) : null}
                      </>
                    ) : (
                      <Button size="sm" onClick={() => act(() => api.planner.requirements.publish(r.id))}>
                        Publish &amp; notify
                      </Button>
                    )}
                    <button type="button" title="Repeat weekly ×4" aria-label="Repeat weekly" className="text-[#94A3B8] hover:text-[color:var(--accent)]" onClick={() => act(() => api.planner.requirements.repeat(r.id, { pattern: 'WEEKLY', count: 4 }))}>
                      <Icon name="repeat" size={15} />
                    </button>
                    <button type="button" aria-label="Delete" className="text-[#94A3B8] hover:text-[#B91C1C]" onClick={() => act(() => api.planner.requirements.remove(r.id))}>
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </div>

                {/* vacancy progress */}
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#F1F5F9]">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${Math.min(100, (r.assigned / r.requiredCount) * 100)}%`, backgroundColor: 'var(--accent)' }}
                  />
                </div>

                {r.assignments.length > 0 ? (
                  <ul className="mt-3 divide-y divide-[#F1F5F9]">
                    {r.assignments.map((a) => (
                      <li key={a.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                        <span className="flex-1 text-[#1E293B]">
                          {a.name} <span className="font-mono text-xs text-[#94A3B8]">{a.waId}</span>
                        </span>
                        <span className={cn('rounded px-1.5 py-0.5 text-[11px] font-medium', sourceTone[a.source])}>{sourceLabel[a.source]}</span>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', respTone[a.status] ?? respTone.ASSIGNED)}>{a.status}</span>
                        <button type="button" onClick={() => act(() => api.planner.assignments.respond(a.id, { response: 'ACCEPTED' }))} className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                          ✓ Accept
                        </button>
                        <button type="button" onClick={() => act(() => api.planner.assignments.respond(a.id, { response: 'DECLINED' }))} className="text-xs font-medium text-[#92400E]">
                          ✕ Decline
                        </button>
                        <button type="button" onClick={() => act(() => api.planner.assignments.remove(a.id))} className="text-[#94A3B8] hover:text-[#B91C1C]">
                          <Icon name="trash" size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            ))}
          </div>
        ))
      )}
      {openShifts.length > 0 ? (
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="bell" size={16} style={{ color: 'var(--accent)' }} />
            <p className="font-medium text-[#1E293B]">Open-Shift Board</p>
            <span className="rounded-full bg-[#FEE2E2] px-2 py-0.5 text-xs font-medium text-[#991B1B]">{openShifts.length} open</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {openShifts.map((o) => (
              <div key={o.requirementId} className="rounded-xl border border-[#E5E7EB] p-3">
                <p className="text-sm font-semibold text-[#1E293B]">{o.role}</p>
                <p className="text-xs text-[#64748B]">
                  {dayLabel(o.date)} · {o.startTime}–{o.endTime}
                  {o.locationText ? ` · ${o.locationText}` : ''}
                </p>
                <p className="mt-1 text-xs font-medium text-[#991B1B]">⚡ {o.vacant} vacant — cascaded to your pool</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <p className="text-xs text-[#94A3B8]">
        Demand-first: enter what you need, then fill it. Publish notifies assigned workers; unfilled vacancies cascade to the
        Open-Shift board and your on-call pool. Workers accept from their own app (Accept/Decline here simulates that).
      </p>

      {assignReq ? (
        <RequirementAssignDrawer
          requirement={reqs.find((r) => r.id === assignReq.id) ?? assignReq}
          onChanged={load}
          onClose={() => setAssignReq(null)}
        />
      ) : null}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: 'ok' | 'bad' }) {
  return (
    <Card className="px-3 py-2.5">
      <p className={cn('text-xl font-semibold', tone === 'ok' ? 'text-[#166534]' : tone === 'bad' ? 'text-[#B91C1C]' : 'text-[#1E293B]')}>{value}</p>
      <p className="text-[11px] text-[#64748B]">{label}</p>
    </Card>
  );
}

const RANGE_VIEWS: { key: string; label: string; days: number }[] = [
  { key: 'day', label: 'Day', days: 1 },
  { key: 'week', label: 'Week', days: 7 },
  { key: 'fortnight', label: 'Fortnight', days: 14 },
  { key: 'month', label: 'Month', days: 28 },
];
const conflictShort: Record<string, string> = {
  DOUBLE_BOOKED: 'Double-booked',
  ON_LEAVE: 'On leave',
  CREDENTIAL_EXPIRED: 'Credential expired',
  OVER_HOURS: 'Over hours',
};

function GridTab({ config }: { config: ResolvedConfig | null }) {
  const [weekStart, setWeekStart] = useState(mondayOfToday());
  const [days, setDays] = useState(7);
  const [week, setWeek] = useState<RosterWeek | null>(null);
  const [reqMap, setReqMap] = useState<Map<string, StaffingRequirementView>>(new Map());
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignReq, setAssignReq] = useState<StaffingRequirementView | null>(null);
  const [panelReq, setPanelReq] = useState<StaffingRequirementView | null>(null);
  const [search, setSearch] = useState('');
  const [teamId, setTeamId] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [weather, setWeather] = useState<Record<string, WeatherDay>>({});

  const weatherOn = !!config?.modules.find((m) => m.key === 'weather' && m.enabled);

  useEffect(() => {
    if (!weatherOn) {
      setWeather({});
      return;
    }
    let active = true;
    api.planner
      .weather(weekStart)
      .then((w) => active && setWeather(Object.fromEntries(w.map((d) => [d.date, d]))))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [weekStart, weatherOn]);

  async function load() {
    const [w, list] = await Promise.all([
      api.planner.grid(weekStart, days),
      api.planner.requirements.list({ from: weekStart, to: addDaysISO(weekStart, days - 1) }),
    ]);
    setWeek(w);
    setReqMap(new Map(list.map((r) => [r.id, r])));
  }

  useEffect(() => {
    api.staff.teams
      .list()
      .then((t) => setTeams(t.map((x) => ({ id: x.id, name: x.name }))))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, days]);

  const catColor = (key: string) => config?.categories.find((c) => c.key === key)?.color ?? '#64748B';
  const cols = `170px repeat(${days}, minmax(${days > 14 ? '84px' : '112px'}, 1fr))`;
  const openReq = (id: string) => {
    const r = reqMap.get(id);
    if (r) setPanelReq(r);
  };
  async function reassignTo(assignmentId: string, toPersonId: string) {
    setError(null);
    try {
      await api.planner.assignments.reassign(assignmentId, { toPersonId });
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const locations = useMemo(() => {
    const set = new Set<string>();
    for (const r of reqMap.values()) if (r.locationText) set.add(r.locationText);
    return [...set].sort();
  }, [reqMap]);

  const cellVisible = (c: { category: string; locationText: string | null }) =>
    (!category || c.category === category) && (!location || c.locationText === location);

  if (loading) return <div className="py-16 text-center text-[#64748B]">Loading…</div>;
  if (error) return <Alert tone="error">{error}</Alert>;
  if (!week) return null;

  const q = search.trim().toLowerCase();
  const rows = week.rows.filter((r) => (!teamId || r.teamId === teamId) && (!q || r.name.toLowerCase().includes(q)));
  const hasLeave = Object.keys(week.leaveByDate).length > 0;

  return (
    <div id="roster-print" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setWeekStart(addDaysISO(weekStart, -days))}>
            ‹
          </Button>
          <span className="min-w-[150px] text-center text-sm font-medium text-[#1E293B]">
            {dayLabel(week.days[0])} – {dayLabel(week.days[week.days.length - 1])}
          </span>
          <Button size="sm" variant="secondary" onClick={() => setWeekStart(addDaysISO(weekStart, days))}>
            ›
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setWeekStart(mondayOfToday())}>
            Today
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {RANGE_VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setDays(v.days)}
              className={cn('rounded-lg px-2.5 py-1 text-xs font-medium', days === v.days ? 'text-white' : 'bg-[#F1F5F9] text-[#64748B]')}
              style={days === v.days ? { backgroundColor: 'var(--accent)' } : undefined}
            >
              {v.label}
            </button>
          ))}
          <Button size="sm" variant="secondary" onClick={() => window.print()}>
            <Icon name="download" size={14} /> Print
          </Button>
        </div>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff…" className="max-w-[180px]" />
        <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="rounded-lg border border-[#E5E7EB] px-2.5 py-2 text-sm text-[#1E293B]">
          <option value="">All teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select value={location} onChange={(e) => setLocation(e.target.value)} className="rounded-lg border border-[#E5E7EB] px-2.5 py-2 text-sm text-[#1E293B]">
          <option value="">All {(config?.terminology.location ?? 'location').toLowerCase()}s</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-[#E5E7EB] px-2.5 py-2 text-sm text-[#1E293B]">
          <option value="">All categories</option>
          {(config?.categories ?? []).map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <Stat label="Employees" value={week.summary.employees} />
        <Stat label="Hours" value={`${week.summary.hours}h`} />
        <Stat label="Assigned" value={week.summary.assigned} tone="ok" />
        <Stat label="Vacant" value={week.summary.vacant} tone={week.summary.vacant > 0 ? 'bad' : 'ok'} />
        <Stat label="On leave" value={week.summary.leave} />
        <Stat label="Overtime" value={`${week.summary.overtime}h`} tone={week.summary.overtime > 0 ? 'bad' : undefined} />
      </div>

      <Card className="overflow-x-auto p-0">
        <div style={{ minWidth: `${170 + days * (days > 14 ? 84 : 112)}px` }}>
          {/* header */}
          <div className="grid border-b border-[#E5E7EB]" style={{ gridTemplateColumns: cols }}>
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Workers</div>
            {week.days.map((d) => {
              const holi = week.holidaysByDate[d];
              const wx = weather[d];
              return (
                <div key={d} className={cn('border-l border-[#E5E7EB] px-2 py-2 text-center text-xs font-semibold', holi ? 'bg-[#FEF2F2] text-[#B91C1C]' : 'text-[#1E293B]')} title={wx ? `${wx.summary} ${wx.tempMin ?? ''}–${wx.tempMax ?? ''}°` : holi ?? ''}>
                  {dShort(d)}
                  {wx ? <span className="block text-[10px] font-normal text-[#64748B]">{wx.emoji} {wx.tempMax != null ? `${Math.round(wx.tempMax)}°` : ''}</span> : null}
                  {holi ? <span className="block truncate text-[9px] font-medium">🇦🇺 {holi}</span> : null}
                </div>
              );
            })}
          </div>

          {/* worker rows */}
          {rows.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-[#94A3B8]">No matching workers rostered.</div>
          ) : (
            rows.map((row) => (
              <div key={row.personId ?? row.name} className="grid border-b border-[#F1F5F9]" style={{ gridTemplateColumns: cols }}>
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-medium text-[#1E293B]">{row.name}</p>
                  <p className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: row.urgentAvailable ? '#C2410C' : row.onCall ? 'var(--accent)' : '#94A3B8' }}
                      title={row.availabilityNote ?? (row.onCall ? 'On-call' : '')}
                    />
                    {row.hours}h · {row.shifts} sh · ${row.estPay.toLocaleString()}
                  </p>
                  {row.source ? <span className={cn('mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium', sourceTone[row.source])}>{sourceLabel[row.source]}</span> : null}
                </div>
                {week.days.map((d) => (
                  <div
                    key={d}
                    className={cn('min-h-[52px] border-l border-[#F1F5F9] p-1', week.holidaysByDate[d] ? 'bg-[#FEF2F2]/40' : '')}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const aid = e.dataTransfer.getData('text/plain');
                      if (aid && row.personId) reassignTo(aid, row.personId);
                    }}
                  >
                    {(row.cellsByDate[d] ?? []).filter(cellVisible).map((c) => (
                      <button
                        key={c.assignmentId}
                        type="button"
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', c.assignmentId)}
                        onClick={() => openReq(c.requirementId)}
                        className="relative mb-1 block w-full cursor-grab rounded-md border-l-[3px] bg-[#F8FAFC] px-1.5 py-1 text-left active:cursor-grabbing"
                        style={{ borderLeftColor: catColor(c.category) }}
                        title={c.conflicts.length ? c.conflicts.map((k) => conflictShort[k] ?? k).join(' · ') : 'Drag to another worker to reassign'}
                      >
                        <span className="block truncate text-[11px] font-semibold text-[#1E293B]">{c.role}</span>
                        <span className="block text-[10px] text-[#64748B]">
                          {c.startTime}–{c.endTime}
                        </span>
                        {c.conflicts.length ? <span className="absolute right-0.5 top-0.5 text-[10px]">⚠</span> : null}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ))
          )}

          {/* open shifts row */}
          <div className="grid bg-[#FFFBEB]" style={{ gridTemplateColumns: cols }}>
            <div className="px-3 py-2 text-xs font-semibold text-[#92400E]">Open shifts</div>
            {week.days.map((d) => (
              <div key={d} className="min-h-[44px] border-l border-[#F8E3B5] p-1">
                {(week.openByDate[d] ?? []).filter(cellVisible).map((o) => (
                  <button
                    key={o.requirementId}
                    type="button"
                    onClick={() => openReq(o.requirementId)}
                    className="mb-1 block w-full rounded-md border border-dashed border-[#E5B567] bg-white px-1.5 py-1 text-left"
                  >
                    <span className="block truncate text-[11px] font-semibold text-[#92400E]">{o.role}</span>
                    <span className="block text-[10px] text-[#B45309]">{o.vacant} vacant</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* leave row */}
          {hasLeave ? (
            <div className="grid border-t border-[#E5E7EB]" style={{ gridTemplateColumns: cols }}>
              <div className="px-3 py-2 text-xs font-semibold text-[#64748B]">Leave</div>
              {week.days.map((d) => (
                <div key={d} className="border-l border-[#F1F5F9] p-1">
                  {(week.leaveByDate[d] ?? []).map((l, i) => (
                    <span key={`${l.name}-${i}`} className="mb-1 block rounded bg-[#EEF2FF] px-1.5 py-0.5 text-[10px] text-[#4338CA]">
                      {l.name} · {l.type}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </Card>

      {panelReq ? (
        <RosterShiftPanel
          requirement={reqMap.get(panelReq.id) ?? panelReq}
          config={config}
          onAssign={() => {
            setAssignReq(reqMap.get(panelReq.id) ?? panelReq);
            setPanelReq(null);
          }}
          onChanged={load}
          onClose={() => setPanelReq(null)}
        />
      ) : null}
      {assignReq ? <RequirementAssignDrawer requirement={assignReq} onChanged={load} onClose={() => setAssignReq(null)} /> : null}
    </div>
  );
}

function TurnUpTab() {
  const [days, setDays] = useState<WhosTurningUpDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.planner.turnup();
        if (active) setDays(data);
      } catch (e) {
        if (active) setError(errorMessage(e));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (days === null) return <div className="py-10 text-center text-sm text-[#64748B]">Loading…</div>;
  if (days.length === 0) return <Card className="p-8 text-center text-sm text-[#94A3B8]">No rostered shifts yet.</Card>;

  return (
    <div className="space-y-4">
      {days.map((d) => {
        const gap = d.declined > 0 || d.pending > 0;
        return (
          <Card key={d.date} className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium text-[#1E293B]">{d.date}</p>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', gap ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#DCFCE7] text-[#166534]')}>
                {d.confirmed} coming{d.pending ? ` · ${d.pending} pending` : ''}
                {d.declined ? ` · ${d.declined} gap` : ''}
              </span>
            </div>
            <ul className="divide-y divide-[#F1F5F9]">
              {d.assignments.map((a) => (
                <li key={a.id} className="flex items-center gap-2 py-2 text-sm">
                  <span className="flex-1 text-[#1E293B]">{a.name}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', respTone[a.status] ?? respTone.ASSIGNED)}>{a.status}</span>
                </li>
              ))}
            </ul>
            {d.declined > 0 ? (
              <p className="mt-2 rounded-lg bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
                ⚠ {d.declined} declined —{' '}
                <Link href="/dashboard/staffing?tab=urgent" style={{ color: 'var(--accent)' }}>
                  raise a replacement
                </Link>
                .
              </p>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
