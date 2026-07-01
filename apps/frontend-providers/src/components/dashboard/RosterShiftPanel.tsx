'use client';

import { useEffect, useState } from 'react';
import type { PlannerCandidate, ResolvedConfig, StaffingRequirementView } from '@workarmy/types';
import { Alert, Button, cn } from '@workarmy/ui';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/form';

const conflictShort: Record<string, string> = {
  DOUBLE_BOOKED: 'Double-booked',
  ON_LEAVE: 'On leave',
  CREDENTIAL_EXPIRED: 'Credential expired',
  OVER_HOURS: 'Over hours',
};

/**
 * Shift Details panel — the read/act view of a requirement opened from a grid
 * cell. Shows details, Smart Warnings (conflicts for current assignees),
 * a compliance checklist rendered from the config gates, notes/custom fields,
 * and footer actions (assign · publish · cascade). All config-driven.
 */
export function RosterShiftPanel({
  requirement,
  config,
  onAssign,
  onChanged,
  onClose,
}: {
  requirement: StaffingRequirementView;
  config: ResolvedConfig | null;
  onAssign: () => void;
  onChanged: () => void;
  onClose: () => void;
}) {
  const [assignees, setAssignees] = useState<PlannerCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cat = config?.categories.find((c) => c.key === requirement.category);
  const marketplaceOn = !!config?.modules.find((m) => m.key === 'marketplace' && m.enabled);

  useEffect(() => {
    let active = true;
    api.planner.requirements
      .candidates(requirement.id)
      .then((data) => active && setAssignees(data.filter((c) => c.assigned)))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [requirement.id]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
        <header className="px-5 py-4 text-white" style={{ backgroundColor: cat?.color ?? '#3f6b46' }}>
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide opacity-90">{cat?.label ?? requirement.category}</span>
            <button type="button" onClick={onClose} aria-label="Close" className="text-lg leading-none opacity-90 hover:opacity-100">
              ✕
            </button>
          </div>
          <h2 className="mt-1 text-xl font-semibold">{requirement.role}</h2>
          <p className="text-sm opacity-90">
            {requirement.startTime}–{requirement.endTime}
            {requirement.locationText ? ` · ${requirement.locationText}` : ''}
          </p>
        </header>

        <div className="space-y-5 px-5 py-5">
          {error ? <Alert tone="error">{error}</Alert> : null}

          <div className="flex gap-2 text-center">
            <div className="flex-1 rounded-xl border border-[#E5E7EB] py-2">
              <p className="text-lg font-semibold text-[#1E293B]">{requirement.requiredCount}</p>
              <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">Required</p>
            </div>
            <div className="flex-1 rounded-xl border border-[#E5E7EB] py-2">
              <p className="text-lg font-semibold text-[#166534]">{requirement.assigned}</p>
              <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">Assigned</p>
            </div>
            <div className="flex-1 rounded-xl border border-[#E5E7EB] py-2">
              <p className={cn('text-lg font-semibold', requirement.vacant > 0 ? 'text-[#B91C1C]' : 'text-[#166534]')}>{requirement.vacant}</p>
              <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">Vacant</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#E5E7EB]">
            <Field k="Date" v={requirement.date} />
            <Field k={config?.terminology.location ?? 'Location'} v={requirement.locationText ?? '—'} />
            <Field k={config?.terminology.client ?? 'Client'} v={requirement.client ?? '—'} />
            <Field k="Pay rate" v={requirement.payRate ? `$${requirement.payRate}/${requirement.payUnit ?? 'hr'}` : '—'} />
            <Field k="Status" v={requirement.status} />
            <Field k="Fill" v={`${requirement.assigned}/${requirement.requiredCount}`} />
          </div>

          {/* Smart warnings */}
          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Assigned · Smart warnings</h3>
            {assignees.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">No one assigned yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {assignees.map((a) => (
                  <li key={a.personId} className="flex flex-wrap items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm">
                    <span className="flex-1 text-[#1E293B]">{a.name}</span>
                    {a.conflicts.length === 0 ? (
                      <span className="rounded bg-[#ECFDF5] px-1.5 py-0.5 text-[11px] font-medium text-[#047857]">OK</span>
                    ) : (
                      a.conflicts.map((cf) => (
                        <span key={cf.kind} className="rounded bg-[#FEE2E2] px-1.5 py-0.5 text-[11px] font-medium text-[#991B1B]">
                          ⚠ {conflictShort[cf.kind] ?? cf.kind}
                        </span>
                      ))
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Compliance checklist from config gates */}
          {(config?.gates.length ?? 0) > 0 ? (
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Compliance checklist</h3>
              <div className="space-y-1.5">
                {config?.gates.map((g) => (
                  <label key={g.key} className="flex items-center gap-2 text-sm text-[#1E293B]">
                    <input type="checkbox" className="h-4 w-4 accent-[color:var(--accent)]" />
                    {g.label}
                  </label>
                ))}
              </div>
            </section>
          ) : null}

          {/* Custom fields */}
          {requirement.fields && Object.keys(requirement.fields).length > 0 ? (
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Details</h3>
              <div className="space-y-1 text-sm">
                {Object.entries(requirement.fields).map(([k, v]) => (
                  <p key={k}>
                    <span className="text-[#64748B]">{k}:</span> {String(v)}
                  </p>
                ))}
              </div>
            </section>
          ) : null}

          {requirement.notes ? (
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Notes</h3>
              <p className="rounded-lg bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B]">{requirement.notes}</p>
            </section>
          ) : null}
        </div>

        <footer className="sticky bottom-0 flex flex-wrap gap-2 border-t border-[#E5E7EB] bg-white px-5 py-3">
          <Button variant="secondary" onClick={onAssign}>
            Assign staff
          </Button>
          {requirement.status !== 'PUBLISHED' ? (
            <Button loading={busy} onClick={() => run(() => api.planner.requirements.publish(requirement.id))}>
              Publish &amp; notify
            </Button>
          ) : requirement.vacant > 0 && marketplaceOn ? (
            <Button variant="ghost" loading={busy} onClick={() => run(() => api.planner.requirements.cascade(requirement.id))}>
              📡 Cascade
            </Button>
          ) : null}
        </footer>
      </aside>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-white px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">{k}</p>
      <p className="text-sm font-medium text-[#1E293B]">{v}</p>
    </div>
  );
}
