'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PlannerCandidate, RosterSource, StaffingRequirementView } from '@workarmy/types';
import { Alert, Button, Input, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

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
const FILTER_SOURCES: RosterSource[] = ['COMPANY', 'CONTRACTOR', 'AGENCY', 'SOLE_TRADER', 'NEARBY'];
const conflictLabel: Record<string, string> = {
  DOUBLE_BOOKED: 'Double-booked',
  ON_LEAVE: 'On leave',
  CREDENTIAL_EXPIRED: 'Credential expired',
  OVER_HOURS: 'Over hours',
};

/**
 * Assign drawer: ranked candidates with source badges, conflict flags, an
 * Available-only filter, search, multi-select assign, auto-fill, and an
 * overlap-confirm step for conflicted picks. Reads api.planner.requirements.*.
 */
export function RequirementAssignDrawer({
  requirement,
  onChanged,
  onClose,
}: {
  requirement: StaffingRequirementView;
  onChanged: () => void;
  onClose: () => void;
}) {
  const [cands, setCands] = useState<PlannerCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Assignees outside the candidate pool (NEARBY claimants / deactivated workers),
  // measured once at open so the live count = in-pool assigned + this constant.
  const [extra, setExtra] = useState(0);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [activeSources, setActiveSources] = useState<Set<RosterSource>>(new Set(['COMPANY', 'CONTRACTOR', 'AGENCY', 'SOLE_TRADER', 'NEARBY']));
  const [availableOnly, setAvailableOnly] = useState(true);
  const [search, setSearch] = useState('');
  const [overlap, setOverlap] = useState<PlannerCandidate[] | null>(null);

  const assigned = cands.filter((c) => c.assigned).length + extra;
  const vacant = Math.max(0, requirement.requiredCount - assigned);

  async function load() {
    const data = await api.planner.requirements.candidates(requirement.id);
    setCands(data);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.planner.requirements.candidates(requirement.id);
        if (active) {
          setCands(data);
          setExtra(Math.max(0, requirement.assigned - data.filter((c) => c.assigned).length));
        }
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
  }, [requirement.id]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cands.filter((c) => {
      if (!activeSources.has(c.source)) return false;
      if (availableOnly && c.conflicts.length > 0) return false;
      if (q && !(c.name.toLowerCase().includes(q) || (c.skills ?? '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [cands, activeSources, availableOnly, search]);

  function toggle(personId: string) {
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });
  }

  async function assignList(list: PlannerCandidate[]) {
    for (const c of list) {
      await api.planner.requirements.assign(requirement.id, { personId: c.personId, source: c.source });
    }
  }

  async function commitSelected() {
    const chosen = cands.filter((c) => sel.has(c.personId) && !c.assigned);
    const conflicted = chosen.filter((c) => c.conflicts.length > 0);
    const clean = chosen.filter((c) => c.conflicts.length === 0);
    setBusy(true);
    setError(null);
    try {
      await assignList(clean);
      setSel(new Set());
      if (conflicted.length) {
        setOverlap(conflicted);
      } else {
        await finish();
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    await load();
    onChanged();
  }

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await finish();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <header className="flex items-start gap-3 border-b border-[#E5E7EB] px-5 py-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-[#1E293B]">Assign · {requirement.role}</h2>
            <p className="text-xs text-[#64748B]">
              {requirement.date} · {requirement.startTime}–{requirement.endTime}
              {requirement.locationText ? ` · ${requirement.locationText}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-xl leading-none text-[#94A3B8] hover:text-[#1E293B]">
            ✕
          </button>
        </header>

        <div className="flex items-center gap-3 border-b border-[#E5E7EB] bg-[#F8FAFC] px-5 py-3">
          <div className="flex-1">
            <p className="text-sm">
              <span className="text-lg font-semibold text-[#1E293B]">{assigned}</span>
              <span className="text-[#64748B]"> of {requirement.requiredCount} filled · </span>
              <span className={cn('font-semibold', vacant > 0 ? 'text-[#B91C1C]' : 'text-[#166534]')}>{vacant > 0 ? `${vacant} vacant` : 'filled'}</span>
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white">
              <span className="block h-full rounded-full" style={{ width: `${Math.min(100, (assigned / requirement.requiredCount) * 100)}%`, backgroundColor: 'var(--accent)' }} />
            </div>
          </div>
          <Button size="sm" variant="secondary" loading={busy} onClick={() => run(() => api.planner.requirements.autoFill(requirement.id))}>
            🤖 Auto-fill
          </Button>
        </div>

        <div className="space-y-3 border-b border-[#E5E7EB] px-5 py-3">
          <div className="flex flex-wrap gap-1.5">
            {FILTER_SOURCES.map((s) => {
              const on = activeSources.has(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setActiveSources((prev) => {
                      const next = new Set(prev);
                      if (next.has(s)) next.delete(s);
                      else next.add(s);
                      return next;
                    })
                  }
                  className={cn('rounded-full border px-2.5 py-1 text-xs font-medium', on ? 'border-[color:var(--accent)] text-[color:var(--accent)]' : 'border-[#E5E7EB] text-[#94A3B8]')}
                >
                  {sourceLabel[s]}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-3">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or skill…" className="flex-1" />
            <button type="button" onClick={() => setAvailableOnly((v) => !v)} className="flex items-center gap-2 text-xs text-[#64748B]">
              <span className={cn('relative h-5 w-9 rounded-full transition', availableOnly ? '' : 'bg-[#CBD5E1]')} style={availableOnly ? { backgroundColor: 'var(--accent)' } : undefined}>
                <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition', availableOnly ? 'left-[18px]' : 'left-0.5')} />
              </span>
              Available only
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {error ? <Alert tone="error">{error}</Alert> : null}
          {loading ? (
            <div className="py-10 text-center text-sm text-[#64748B]">Loading candidates…</div>
          ) : visible.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#94A3B8]">No matching candidates. Widen sources or turn off “Available only”.</div>
          ) : (
            <ul className="space-y-1.5">
              {visible.map((c) => {
                const selected = sel.has(c.personId);
                return (
                  <li
                    key={c.personId}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border px-3 py-2',
                      c.assigned ? 'border-[#E5E7EB] bg-[#F8FAFC] opacity-70' : selected ? 'border-[color:var(--accent)] bg-[#F8FAFC]' : 'border-[#E5E7EB]',
                    )}
                  >
                    <button
                      type="button"
                      disabled={c.assigned}
                      onClick={() => toggle(c.personId)}
                      className={cn('grid h-5 w-5 shrink-0 place-items-center rounded border text-xs text-white', selected || c.assigned ? 'border-[color:var(--accent)]' : 'border-[#CBD5E1]')}
                      style={selected || c.assigned ? { backgroundColor: 'var(--accent)' } : undefined}
                    >
                      {selected || c.assigned ? '✓' : ''}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#1E293B]">
                        {c.name}
                        {c.assigned ? <span className="ml-1 text-xs font-normal text-[#94A3B8]">· assigned</span> : null}
                      </p>
                      <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#64748B]">
                        <span className={cn('rounded px-1.5 py-0.5 font-medium', sourceTone[c.source])}>{sourceLabel[c.source]}</span>
                        {c.skills ? <span className="truncate">{c.skills}</span> : null}
                        {c.conflicts.map((cf) => (
                          <span key={cf.kind} className="rounded bg-[#FEE2E2] px-1.5 py-0.5 font-medium text-[#991B1B]">
                            ⚠ {conflictLabel[cf.kind] ?? cf.kind}
                          </span>
                        ))}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={cn('font-semibold', c.score >= 70 ? 'text-[#166534]' : c.score >= 40 ? 'text-[#92400E]' : 'text-[#94A3B8]')}>{c.score}%</p>
                      <p className="text-[10px] text-[#94A3B8]">match</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="flex items-center gap-3 border-t border-[#E5E7EB] px-5 py-3">
          <span className="text-sm text-[#64748B]">
            Selected <b className="text-[#1E293B]">{sel.size}</b>
          </span>
          <span className="flex-1" />
          <Button variant="ghost" onClick={onClose}>
            Done
          </Button>
          <Button loading={busy} disabled={sel.size === 0} onClick={commitSelected}>
            Assign selected
          </Button>
        </footer>

        {overlap ? (
          <OverlapConfirm
            candidates={overlap}
            onSkip={() => {
              setOverlap(null);
              void finish();
            }}
            onAssign={async () => {
              const list = overlap;
              setOverlap(null);
              await run(() => assignList(list));
            }}
          />
        ) : null}
      </aside>
    </div>
  );
}

function OverlapConfirm({
  candidates,
  onAssign,
  onSkip,
}: {
  candidates: PlannerCandidate[];
  onAssign: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 px-5">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-base font-semibold text-[#1E293B]">Conflicts on {candidates.length} pick{candidates.length > 1 ? 's' : ''}</h3>
        <ul className="my-3 space-y-2">
          {candidates.map((c) => (
            <li key={c.personId} className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm">
              <p className="font-medium text-[#991B1B]">{c.name}</p>
              <p className="text-xs text-[#7A4440]">{c.conflicts.map((cf) => conflictLabel[cf.kind] ?? cf.kind).join(' · ')}</p>
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onSkip}>
            Skip
          </Button>
          <Button variant="danger" onClick={onAssign}>
            Assign anyway
          </Button>
        </div>
      </div>
    </div>
  );
}
