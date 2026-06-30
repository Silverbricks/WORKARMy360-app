import { Injectable } from '@nestjs/common';
import type { AssignmentStatus, Prisma } from '@workarmy/database';
import type { OkResponse, PlannerCandidate, PlannerSummary, StaffingRequirementView } from '@workarmy/types';
import type {
  PlannerAssignData,
  PlannerRespondData,
  StaffingRequirementInputData,
  StaffingRequirementUpdateData,
} from '@workarmy/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { ApiException } from '../../common/errors/api-exception';
import { ConfigService } from '../platform/config.service';
import { PlannerConflictService, isoWeekKey } from './planner-conflict.service';

/** Assignment statuses that count toward a requirement being filled. */
export const ACTIVE_ASSIGNMENT: AssignmentStatus[] = ['ASSIGNED', 'CONFIRMED', 'ACCEPTED', 'COMPLETED'];

const nameOf = (p: { firstName: string | null; lastName: string | null; waId: string }) =>
  `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.waId;

/** Whole hours between two HH:MM times (wraps past midnight). */
export function shiftHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let h = eh + em / 60 - (sh + sm / 60);
  if (h < 0) h += 24;
  return h;
}

type ReqWithAssignments = Prisma.StaffingRequirementGetPayload<{ include: { assignments: true } }>;
type PersonLite = { waId: string; name: string };

@Injectable()
export class PlannerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
    private readonly config: ConfigService,
    private readonly conflict: PlannerConflictService,
  ) {}

  // ---- requirements --------------------------------------------------------

  async list(userId: string, q: { from?: string; to?: string }): Promise<StaffingRequirementView[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const reqs = await this.prisma.staffingRequirement.findMany({
      where: { orgId, ...dateFilter(q) },
      include: { assignments: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    const persons = await this.personsFor(reqs);
    return reqs.map((r) => toView(r, persons));
  }

  async create(userId: string, input: StaffingRequirementInputData): Promise<StaffingRequirementView> {
    const { orgId } = await this.membership.requireOrg(userId);
    const r = await this.prisma.staffingRequirement.create({
      data: {
        orgId,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        role: input.role,
        category: input.category ?? 'general',
        siteId: input.siteId ?? null,
        locationText: input.locationText ?? null,
        client: input.client ?? null,
        payRate: input.payRate ?? null,
        payUnit: input.payUnit ?? null,
        requiredCount: input.requiredCount ?? 1,
        openMarketplace: input.openMarketplace ?? false,
        notes: input.notes ?? null,
        fields: (input.fields as Prisma.InputJsonValue) ?? undefined,
        status: 'OPEN',
      },
      include: { assignments: true },
    });
    return toView(r, new Map());
  }

  async update(userId: string, id: string, input: StaffingRequirementUpdateData): Promise<StaffingRequirementView> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.requireReq(orgId, id);
    await this.prisma.staffingRequirement.update({
      where: { id },
      data: {
        date: input.date ?? undefined,
        startTime: input.startTime ?? undefined,
        endTime: input.endTime ?? undefined,
        role: input.role ?? undefined,
        category: input.category ?? undefined,
        siteId: input.siteId ?? undefined,
        locationText: input.locationText ?? undefined,
        client: input.client ?? undefined,
        payRate: input.payRate ?? undefined,
        payUnit: input.payUnit ?? undefined,
        requiredCount: input.requiredCount ?? undefined,
        openMarketplace: input.openMarketplace ?? undefined,
        notes: input.notes ?? undefined,
        fields: (input.fields as Prisma.InputJsonValue) ?? undefined,
      },
    });
    return this.view(orgId, id);
  }

  async remove(userId: string, id: string): Promise<OkResponse> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.requireReq(orgId, id);
    await this.prisma.staffingRequirement.delete({ where: { id } });
    return { ok: true };
  }

  // ---- assignment ----------------------------------------------------------

  async assign(userId: string, id: string, body: PlannerAssignData): Promise<StaffingRequirementView> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.requireReq(orgId, id);
    const person = body.personId
      ? await this.personById(body.personId)
      : await this.personByWaId(body.waId ?? '');
    const source = body.source ?? (await this.inferSource(orgId, person.id));
    await this.prisma.requirementAssignment.upsert({
      where: { requirementId_personId: { requirementId: id, personId: person.id } },
      update: { status: 'ASSIGNED', source },
      create: { requirementId: id, personId: person.id, source, status: 'ASSIGNED' },
    });
    return this.view(orgId, id);
  }

  async unassign(userId: string, assignmentId: string): Promise<OkResponse> {
    const { orgId } = await this.membership.requireOrg(userId);
    const a = await this.assignmentInOrg(orgId, assignmentId);
    await this.prisma.requirementAssignment.delete({ where: { id: a.id } });
    return { ok: true };
  }

  async respond(userId: string, assignmentId: string, body: PlannerRespondData): Promise<OkResponse> {
    const { orgId } = await this.membership.requireOrg(userId);
    const a = await this.assignmentInOrg(orgId, assignmentId);
    await this.prisma.requirementAssignment.update({ where: { id: a.id }, data: { status: body.response } });
    return { ok: true };
  }

  // ---- summary -------------------------------------------------------------

  async summary(userId: string, q: { from?: string; to?: string }): Promise<PlannerSummary> {
    const { orgId } = await this.membership.requireOrg(userId);
    const [reqs, available, leave] = await this.prisma.$transaction([
      this.prisma.staffingRequirement.findMany({ where: { orgId, ...dateFilter(q) }, include: { assignments: true } }),
      this.prisma.orgWorker.count({ where: { orgId, active: true } }),
      this.prisma.leaveRequest.count({ where: { orgId, status: 'APPROVED' } }),
    ]);
    let required = 0;
    let assigned = 0;
    let hours = 0;
    let estPayroll = 0;
    for (const r of reqs) {
      required += r.requiredCount;
      const active = r.assignments.filter((a) => ACTIVE_ASSIGNMENT.includes(a.status)).length;
      assigned += active;
      const h = shiftHours(r.startTime, r.endTime);
      hours += h * active;
      estPayroll += (r.payRate ?? 0) * h * active;
    }
    return {
      required,
      assigned,
      vacant: Math.max(0, required - assigned),
      leave,
      overtime: 0,
      available,
      hours: Math.round(hours),
      estPayroll: Math.round(estPayroll),
    };
  }

  // ---- candidates + auto-fill (smarts) -------------------------------------

  async candidates(userId: string, id: string, sources?: string): Promise<PlannerCandidate[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const req = await this.prisma.staffingRequirement.findFirst({ where: { id, orgId }, include: { assignments: true } });
    if (!req) throw ApiException.notFound('Requirement not found.');
    const config = await this.config.resolve(orgId);
    const isUrgent = req.category === 'urgent';
    const sourceFilter = sources ? new Set(sources.split(',').map((s) => s.trim()).filter(Boolean)) : null;

    const workers = await this.prisma.orgWorker.findMany({
      where: { orgId, active: true },
      include: {
        person: {
          select: {
            id: true,
            waId: true,
            firstName: true,
            lastName: true,
            profile: { select: { skills: true, suburb: true, state: true } },
          },
        },
      },
    });
    const pool = sourceFilter ? workers.filter((w) => sourceFilter.has(w.source)) : workers;
    const personIds = pool.map((w) => w.personId);
    if (personIds.length === 0) return [];

    const assignedSet = new Set(req.assignments.map((a) => a.personId));
    const weekKey = isoWeekKey(req.date);

    const [reqAssigns, shiftAssigns, leaves, creds] = await Promise.all([
      this.prisma.requirementAssignment.findMany({
        where: { personId: { in: personIds }, status: { in: ACTIVE_ASSIGNMENT } },
        include: { requirement: { select: { id: true, date: true, startTime: true, endTime: true } } },
      }),
      this.prisma.shiftAssignment.findMany({
        where: { personId: { in: personIds }, status: { in: ACTIVE_ASSIGNMENT } },
        include: { shift: { select: { startAt: true, endAt: true } } },
      }),
      this.prisma.leaveRequest.findMany({
        where: { orgId, status: 'APPROVED' },
        select: { personName: true, startDate: true, endDate: true },
      }),
      this.prisma.credential.findMany({
        where: { personId: { in: personIds }, expiresAt: { not: null } },
        select: { personId: true, type: true, expiresAt: true },
      }),
    ]);

    const busy = new Map<string, { start: string; end: string }[]>();
    const weekHours = new Map<string, number>();
    const pushBusy = (pid: string, iv: { start: string; end: string }) => {
      const list = busy.get(pid) ?? [];
      list.push(iv);
      busy.set(pid, list);
    };
    const addHours = (pid: string, h: number) => weekHours.set(pid, (weekHours.get(pid) ?? 0) + h);

    for (const a of reqAssigns) {
      const r = a.requirement;
      if (r.id === req.id) continue; // ignore the target requirement itself
      if (r.date === req.date) pushBusy(a.personId, { start: r.startTime, end: r.endTime });
      if (isoWeekKey(r.date) === weekKey) addHours(a.personId, shiftHours(r.startTime, r.endTime));
    }
    for (const a of shiftAssigns) {
      const sDate = a.shift.startAt.toISOString().slice(0, 10);
      const sStart = a.shift.startAt.toISOString().slice(11, 16);
      const sEnd = a.shift.endAt.toISOString().slice(11, 16);
      if (sDate === req.date) pushBusy(a.personId, { start: sStart, end: sEnd });
      if (isoWeekKey(sDate) === weekKey) addHours(a.personId, shiftHours(sStart, sEnd));
    }
    const credsBy = new Map<string, { type: string; expiresAt: Date | null }[]>();
    for (const c of creds) {
      if (!c.personId) continue;
      const list = credsBy.get(c.personId) ?? [];
      list.push({ type: c.type, expiresAt: c.expiresAt });
      credsBy.set(c.personId, list);
    }

    const out: PlannerCandidate[] = pool.map((w) => {
      const p = w.person;
      const name = nameOf({ firstName: p.firstName, lastName: p.lastName, waId: p.waId });
      const conflicts = this.conflict.conflicts({
        date: req.date,
        start: req.startTime,
        end: req.endTime,
        gates: config.gates,
        personName: name,
        busyIntervals: busy.get(w.personId) ?? [],
        leaves,
        credentials: credsBy.get(w.personId) ?? [],
        weekHours: weekHours.get(w.personId) ?? 0,
      });
      const { score, reasons } = this.conflict.score({
        reqRole: req.role,
        reqCategory: req.category,
        isUrgent,
        skills: p.profile?.skills ?? null,
        suburb: p.profile?.suburb ?? null,
        state: p.profile?.state ?? null,
        onCall: w.onCall,
        urgentAvailable: w.urgentAvailable,
        conflictCount: conflicts.length,
      });
      return {
        personId: w.personId,
        waId: p.waId,
        name,
        source: w.source,
        skills: p.profile?.skills ?? null,
        suburb: p.profile?.suburb ?? null,
        state: p.profile?.state ?? null,
        payRate: null,
        score,
        scoreReasons: reasons,
        conflicts,
        assigned: assignedSet.has(w.personId),
      };
    });
    out.sort((a, b) => b.score - a.score);
    return out;
  }

  /** Assign the top zero-conflict candidates up to the vacancy count. */
  async autoFill(userId: string, id: string): Promise<StaffingRequirementView> {
    const { orgId } = await this.membership.requireOrg(userId);
    const cands = await this.candidates(userId, id);
    const view = await this.view(orgId, id);
    let vacant = view.vacant;
    const assigned = new Set(view.assignments.map((a) => a.personId));
    for (const c of cands) {
      if (vacant <= 0) break;
      if (assigned.has(c.personId) || c.conflicts.length > 0) continue;
      await this.prisma.requirementAssignment.upsert({
        where: { requirementId_personId: { requirementId: id, personId: c.personId } },
        update: { status: 'ASSIGNED', source: c.source },
        create: { requirementId: id, personId: c.personId, source: c.source, status: 'ASSIGNED' },
      });
      assigned.add(c.personId);
      vacant -= 1;
    }
    return this.view(orgId, id);
  }

  // ---- internals -----------------------------------------------------------

  /** Re-fetch + map one requirement to its view (after a mutation). */
  async view(orgId: string, id: string): Promise<StaffingRequirementView> {
    const r = await this.prisma.staffingRequirement.findFirst({ where: { id, orgId }, include: { assignments: true } });
    if (!r) throw ApiException.notFound('Requirement not found.');
    const persons = await this.personsFor([r]);
    return toView(r, persons);
  }

  private async requireReq(orgId: string, id: string) {
    const r = await this.prisma.staffingRequirement.findFirst({ where: { id, orgId }, select: { id: true } });
    if (!r) throw ApiException.notFound('Requirement not found.');
    return r;
  }

  private async assignmentInOrg(orgId: string, assignmentId: string) {
    const a = await this.prisma.requirementAssignment.findUnique({
      where: { id: assignmentId },
      include: { requirement: { select: { orgId: true } } },
    });
    if (!a || a.requirement.orgId !== orgId) throw ApiException.notFound('Assignment not found.');
    return a;
  }

  private async inferSource(orgId: string, personId: string): Promise<'COMPANY' | 'CONTRACTOR' | 'AGENCY' | 'SOLE_TRADER' | 'NEARBY'> {
    const worker = await this.prisma.orgWorker.findUnique({
      where: { orgId_personId: { orgId, personId } },
      select: { source: true },
    });
    return worker?.source ?? 'COMPANY';
  }

  private async personByWaId(waId: string) {
    const person = await this.prisma.person.findUnique({
      where: { waId: waId.trim() },
      select: { id: true, waId: true, firstName: true, lastName: true },
    });
    if (!person) throw ApiException.badRequest('VALIDATION_ERROR', `No worker found for ${waId}.`);
    return person;
  }

  private async personById(personId: string) {
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
      select: { id: true, waId: true, firstName: true, lastName: true },
    });
    if (!person) throw ApiException.badRequest('VALIDATION_ERROR', 'No worker found.');
    return person;
  }

  /** Batch-load the person name/waId for a set of requirements' assignments. */
  private async personsFor(reqs: ReqWithAssignments[]): Promise<Map<string, PersonLite>> {
    const ids = [...new Set(reqs.flatMap((r) => r.assignments.map((a) => a.personId)))];
    if (ids.length === 0) return new Map();
    const persons = await this.prisma.person.findMany({
      where: { id: { in: ids } },
      select: { id: true, waId: true, firstName: true, lastName: true },
    });
    return new Map(persons.map((p) => [p.id, { waId: p.waId, name: nameOf(p) }]));
  }
}

// --- pure mappers ----------------------------------------------------------

function dateFilter(q: { from?: string; to?: string }): { date?: Prisma.StringFilter } {
  if (q.from && q.to) return { date: { gte: q.from, lte: q.to } };
  if (q.from) return { date: { gte: q.from } };
  if (q.to) return { date: { lte: q.to } };
  return {};
}

function toView(r: ReqWithAssignments, persons: Map<string, PersonLite>): StaffingRequirementView {
  const assignments = r.assignments.map((a) => {
    const p = persons.get(a.personId);
    return {
      id: a.id,
      personId: a.personId,
      waId: p?.waId ?? '',
      name: p?.name ?? '(unknown)',
      source: a.source,
      status: a.status,
    };
  });
  const active = r.assignments.filter((a) => ACTIVE_ASSIGNMENT.includes(a.status)).length;
  return {
    id: r.id,
    date: r.date,
    startTime: r.startTime,
    endTime: r.endTime,
    role: r.role,
    category: r.category,
    siteId: r.siteId,
    locationText: r.locationText,
    client: r.client,
    payRate: r.payRate,
    payUnit: r.payUnit,
    requiredCount: r.requiredCount,
    status: r.status,
    openMarketplace: r.openMarketplace,
    notes: r.notes,
    fields: (r.fields as Record<string, unknown> | null) ?? null,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    assigned: active,
    vacant: Math.max(0, r.requiredCount - active),
    assignments,
  };
}
