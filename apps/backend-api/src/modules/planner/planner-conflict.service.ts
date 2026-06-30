import { Injectable } from '@nestjs/common';
import type { ConfigGate, Conflict } from '@workarmy/types';
import { shiftHours } from './planner.service';

export const OVERTIME_THRESHOLD_HOURS = 38;

/** HH:MM → minutes since midnight. */
function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * The minute segments an HH:MM shift occupies within a single calendar day.
 * An overnight shift (end <= start, e.g. 21:00–07:30) splits into the evening
 * segment [start,1440) and the next-morning segment [0,end) — both belong to the
 * shift's start date, which is how busy intervals are anchored.
 */
function toSegments(start: string, end: string): Array<[number, number]> {
  const s = toMin(start);
  const e = toMin(end);
  if (e > s) return [[s, e]];
  if (e === s) return [[s, s + 1]]; // zero-length guard
  return [
    [s, 1440],
    [0, e],
  ];
}

/** Do two HH:MM intervals overlap? Correct for overnight (wrapping) shifts. */
export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const a = toSegments(aStart, aEnd);
  const b = toSegments(bStart, bEnd);
  return a.some(([as, ae]) => b.some(([bs, be]) => as < be && bs < ae));
}

/** Best-effort name match (no LeaveRequest.personId FK yet). */
export function nameMatch(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  return norm(a) === norm(b);
}

/** Monday-of-week key (UTC) for grouping hours into an ISO week. */
export function isoWeekKey(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7; // Mon = 0
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export interface CandidateContext {
  date: string;
  start: string;
  end: string;
  gates: ConfigGate[];
  personName: string;
  /** Active assignments the person already holds on `date` (req + legacy shift). */
  busyIntervals: { start: string; end: string }[];
  /** APPROVED leave rows for the org (filtered to this person by name). */
  leaves: { personName: string; startDate: string; endDate: string }[];
  credentials: { type: string; expiresAt: Date | null }[];
  /** Hours already assigned in the same ISO week (excluding this requirement). */
  weekHours: number;
}

export interface ScoreInput {
  reqRole: string;
  reqCategory: string;
  isUrgent: boolean;
  skills: string | null;
  suburb: string | null;
  state: string | null;
  onCall: boolean;
  urgentAvailable: boolean;
  conflictCount: number;
  weights?: { skills: number; location: number; availability: number; urgency: number };
}

const DEFAULT_WEIGHTS = { skills: 35, location: 20, availability: 20, urgency: 15 };

/**
 * Conflict + best-match engine. Deterministic (no LLM). All checks are WARN —
 * the engine never hard-blocks; the gate set comes from the resolved config, so
 * "compliance off ⇒ no gates ⇒ no credential check" is pure configuration.
 * These four checks are the seed the future Rule Builder generalizes.
 */
@Injectable()
export class PlannerConflictService {
  conflicts(ctx: CandidateContext): Conflict[] {
    const out: Conflict[] = [];

    if (ctx.busyIntervals.some((iv) => overlaps(ctx.start, ctx.end, iv.start, iv.end))) {
      out.push({ kind: 'DOUBLE_BOOKED', severity: 'WARN', message: 'Already rostered at an overlapping time.' });
    }

    if (ctx.leaves.some((l) => nameMatch(l.personName, ctx.personName) && ctx.date >= l.startDate && ctx.date <= l.endDate)) {
      out.push({ kind: 'ON_LEAVE', severity: 'WARN', message: 'On approved leave on this date.' });
    }

    const gateTypes = new Set(ctx.gates.map((g) => g.credentialType));
    const reqDay = new Date(`${ctx.date}T00:00:00Z`);
    for (const c of ctx.credentials) {
      if (gateTypes.has(c.type) && c.expiresAt && c.expiresAt.getTime() < reqDay.getTime()) {
        out.push({ kind: 'CREDENTIAL_EXPIRED', severity: 'WARN', message: `${c.type} expired.` });
      }
    }

    if (ctx.weekHours + shiftHours(ctx.start, ctx.end) > OVERTIME_THRESHOLD_HOURS) {
      out.push({ kind: 'OVER_HOURS', severity: 'WARN', message: `Over ${OVERTIME_THRESHOLD_HOURS}h this week.` });
    }

    return out;
  }

  /** 0–100 deterministic match score + human reasons. */
  score(input: ScoreInput): { score: number; reasons: string[] } {
    const w = input.weights ?? DEFAULT_WEIGHTS;
    const reasons: string[] = [];
    let score = 0;

    // Skills overlap with the role/category text.
    const haystack = (input.skills ?? '').toLowerCase();
    const needles = `${input.reqRole} ${input.reqCategory}`.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);
    const hits = needles.filter((n) => haystack.includes(n)).length;
    if (needles.length && hits) {
      const s = Math.round((hits / needles.length) * w.skills);
      score += s;
      reasons.push(`Skills match (+${s})`);
    }

    // Location signal (no geo in v1 — presence of locality counts).
    let loc = 0;
    if (input.suburb) loc += Math.round(w.location * 0.6);
    if (input.state) loc += Math.round(w.location * 0.4);
    if (loc) {
      score += loc;
      reasons.push(`Locality known (+${loc})`);
    }

    // Availability.
    if (input.onCall) {
      score += Math.round(w.availability * 0.6);
      reasons.push('On-call');
    }
    if (input.urgentAvailable) {
      score += Math.round(w.availability * 0.4);
      reasons.push('Available for urgent');
    }

    // Urgency alignment.
    if (input.isUrgent && input.urgentAvailable) {
      score += w.urgency;
      reasons.push('Matches urgent need');
    }

    // Conflict penalty.
    if (input.conflictCount > 0) {
      const pen = input.conflictCount * 10;
      score -= pen;
      reasons.push(`Conflicts (−${pen})`);
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }
}
