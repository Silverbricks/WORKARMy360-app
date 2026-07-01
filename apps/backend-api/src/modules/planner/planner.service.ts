import { Injectable } from '@nestjs/common';
import type { AssignmentStatus, DispatchChannel, Prisma } from '@workarmy/database';
import type {
  MarketplaceShift,
  MyShiftView,
  OkResponse,
  OpenShift,
  PlannerCandidate,
  PlannerSummary,
  RosterAssignment,
  RosterStaffCard,
  RosterGridRow,
  RosterLeaveCell,
  RosterOpenCell,
  RosterTemplateView,
  RosterWeek,
  StaffingRequirementView,
  WeatherDay,
  WhosTurningUpDay,
} from '@workarmy/types';
import type {
  PlannerAssignData,
  PlannerCopyData,
  PlannerFromTemplateData,
  PlannerRepeatData,
  PlannerRespondData,
  RosterTemplateInputData,
  StaffingRequirementInputData,
  StaffingRequirementUpdateData,
} from '@workarmy/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '../platform/config.service';
import { PlatformEventsService } from '../platform/platform-events.service';
import { ApiException } from '../../common/errors/api-exception';
import { OVERTIME_THRESHOLD_HOURS, PlannerConflictService, isoWeekKey } from './planner-conflict.service';
import { holidaysForDates } from './au-holidays';
import { WeatherService } from './weather.service';

type ReqAssignmentRow = { personId: string; status: AssignmentStatus };
const activeCount = (assignments: ReqAssignmentRow[]) =>
  assignments.filter((a) => ACTIVE_ASSIGNMENT.includes(a.status)).length;

/** ISO date + N days (UTC-safe). */
function addDaysISO(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

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
    private readonly notifications: NotificationsService,
    private readonly events: PlatformEventsService,
    private readonly weatherService: WeatherService,
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

  /** Move an assignment to a different worker (grid drag-drop). */
  async reassign(userId: string, assignmentId: string, toPersonId: string): Promise<StaffingRequirementView> {
    const { orgId } = await this.membership.requireOrg(userId);
    const a = await this.assignmentInOrg(orgId, assignmentId);
    if (a.personId === toPersonId) return this.view(orgId, a.requirementId);
    await this.personById(toPersonId); // 400 if the target person doesn't exist
    const source = await this.inferSource(orgId, toPersonId);
    const existing = await this.prisma.requirementAssignment.findUnique({
      where: { requirementId_personId: { requirementId: a.requirementId, personId: toPersonId } },
    });
    if (existing) {
      // Target already on this requirement — drop the source (a merge, not a dup).
      await this.prisma.requirementAssignment.delete({ where: { id: a.id } });
    } else {
      await this.prisma.requirementAssignment.update({
        where: { id: a.id },
        data: { personId: toPersonId, source, status: 'ASSIGNED' },
      });
    }
    return this.view(orgId, a.requirementId);
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
    let openShifts = 0;
    const perWorkerWeek = new Map<string, number>();
    for (const r of reqs) {
      required += r.requiredCount;
      const activeAssigns = r.assignments.filter((a) => ACTIVE_ASSIGNMENT.includes(a.status));
      const active = activeAssigns.length;
      assigned += active;
      const h = shiftHours(r.startTime, r.endTime);
      hours += h * active;
      estPayroll += (r.payRate ?? 0) * h * active;
      if (r.requiredCount - active > 0) openShifts += 1;
      for (const a of activeAssigns) {
        const wk = `${a.personId}|${isoWeekKey(r.date)}`;
        perWorkerWeek.set(wk, (perWorkerWeek.get(wk) ?? 0) + h);
      }
    }
    let overtime = 0;
    for (const wh of perWorkerWeek.values()) overtime += Math.max(0, wh - OVERTIME_THRESHOLD_HOURS);
    return {
      required,
      assigned,
      vacant: Math.max(0, required - assigned),
      leave,
      overtime: Math.round(overtime),
      available,
      hours: Math.round(hours),
      estPayroll: Math.round(estPayroll),
      employees: available,
      openShifts,
      publicHolidays: 0,
    };
  }

  // ---- candidates + auto-fill (smarts) -------------------------------------

  /** Batch-load the conflict inputs (active assignments, leave, credentials) for
   *  a set of people — shared by candidates() and grid(). */
  private async loadConflictData(orgId: string, personIds: string[]): Promise<{
    leaves: { personName: string; startDate: string; endDate: string }[];
    credsBy: Map<string, { type: string; expiresAt: Date | null }[]>;
    assignmentsBy: Map<string, AssignmentLite[]>;
  }> {
    if (personIds.length === 0) return { leaves: [], credsBy: new Map(), assignmentsBy: new Map() };
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
    const assignmentsBy = new Map<string, AssignmentLite[]>();
    const push = (pid: string, a: AssignmentLite) => {
      const l = assignmentsBy.get(pid) ?? [];
      l.push(a);
      assignmentsBy.set(pid, l);
    };
    for (const a of reqAssigns) {
      push(a.personId, { requirementId: a.requirement.id, date: a.requirement.date, start: a.requirement.startTime, end: a.requirement.endTime });
    }
    for (const a of shiftAssigns) {
      push(a.personId, {
        requirementId: null,
        date: a.shift.startAt.toISOString().slice(0, 10),
        start: a.shift.startAt.toISOString().slice(11, 16),
        end: a.shift.endAt.toISOString().slice(11, 16),
      });
    }
    const credsBy = new Map<string, { type: string; expiresAt: Date | null }[]>();
    for (const c of creds) {
      if (!c.personId) continue;
      const l = credsBy.get(c.personId) ?? [];
      l.push({ type: c.type, expiresAt: c.expiresAt });
      credsBy.set(c.personId, l);
    }
    return { leaves, credsBy, assignmentsBy };
  }

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
    const ctx = await this.loadConflictData(orgId, personIds);

    const out: PlannerCandidate[] = pool.map((w) => {
      const p = w.person;
      const name = nameOf({ firstName: p.firstName, lastName: p.lastName, waId: p.waId });
      const { busy, weekHours } = busyAndWeekHours(ctx.assignmentsBy.get(w.personId) ?? [], req.date, req.id);
      const conflicts = this.conflict.conflicts({
        date: req.date,
        start: req.startTime,
        end: req.endTime,
        gates: config.gates,
        personName: name,
        busyIntervals: busy,
        leaves: ctx.leaves,
        credentials: ctx.credsBy.get(w.personId) ?? [],
        weekHours,
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

  // ---- templates -----------------------------------------------------------

  async listTemplates(userId: string): Promise<RosterTemplateView[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.rosterTemplate.findMany({ where: { orgId }, orderBy: { name: 'asc' } });
    return rows.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      role: t.role,
      startTime: t.startTime,
      endTime: t.endTime,
      siteId: t.siteId,
      requiredCount: t.requiredCount,
      payRate: t.payRate,
      payUnit: t.payUnit,
      templateKey: t.templateKey,
    }));
  }

  async createTemplate(userId: string, input: RosterTemplateInputData): Promise<RosterTemplateView> {
    const { orgId } = await this.membership.requireOrg(userId);
    const t = await this.prisma.rosterTemplate.create({
      data: {
        orgId,
        name: input.name,
        category: input.category ?? 'general',
        role: input.role ?? null,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        siteId: input.siteId ?? null,
        requiredCount: input.requiredCount ?? 1,
        payRate: input.payRate ?? null,
        payUnit: input.payUnit ?? null,
      },
    });
    return {
      id: t.id,
      name: t.name,
      category: t.category,
      role: t.role,
      startTime: t.startTime,
      endTime: t.endTime,
      siteId: t.siteId,
      requiredCount: t.requiredCount,
      payRate: t.payRate,
      payUnit: t.payUnit,
      templateKey: t.templateKey,
    };
  }

  async removeTemplate(userId: string, id: string): Promise<OkResponse> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.prisma.rosterTemplate.deleteMany({ where: { id, orgId } });
    return { ok: true };
  }

  async fromTemplate(userId: string, body: PlannerFromTemplateData): Promise<StaffingRequirementView> {
    const { orgId } = await this.membership.requireOrg(userId);
    const t = await this.prisma.rosterTemplate.findFirst({ where: { id: body.templateId, orgId } });
    if (!t) throw ApiException.notFound('Template not found.');
    const r = await this.prisma.staffingRequirement.create({
      data: {
        orgId,
        date: body.date,
        startTime: t.startTime ?? '09:00',
        endTime: t.endTime ?? '17:00',
        role: t.role ?? t.name,
        category: t.category,
        siteId: t.siteId,
        payRate: t.payRate,
        payUnit: t.payUnit,
        requiredCount: t.requiredCount,
        status: 'OPEN',
      },
      include: { assignments: true },
    });
    return toView(r, new Map());
  }

  // ---- copy / repeat -------------------------------------------------------

  async copy(userId: string, body: PlannerCopyData): Promise<StaffingRequirementView[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const src = await this.prisma.staffingRequirement.findMany({ where: { orgId, date: body.fromDate } });
    const created = await this.prisma.$transaction(
      src.map((r) =>
        this.prisma.staffingRequirement.create({
          data: {
            orgId,
            date: body.toDate,
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
            notes: r.notes,
            status: 'DRAFT',
          },
          include: { assignments: true },
        }),
      ),
    );
    return created.map((r) => toView(r, new Map()));
  }

  async repeat(userId: string, id: string, body: PlannerRepeatData): Promise<StaffingRequirementView[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const r = await this.prisma.staffingRequirement.findFirst({ where: { id, orgId } });
    if (!r) throw ApiException.notFound('Requirement not found.');
    const step = body.pattern === 'DAILY' ? 1 : body.pattern === 'FORTNIGHTLY' ? 14 : 7;
    const dates = Array.from({ length: body.count }, (_, i) => addDaysISO(r.date, step * (i + 1)));
    const created = await this.prisma.$transaction(
      dates.map((date) =>
        this.prisma.staffingRequirement.create({
          data: {
            orgId,
            date,
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
            notes: r.notes,
            status: 'DRAFT',
          },
          include: { assignments: true },
        }),
      ),
    );
    return created.map((c) => toView(c, new Map()));
  }

  // ---- publish + cascade ---------------------------------------------------

  async publish(userId: string, id: string): Promise<StaffingRequirementView> {
    const { orgId } = await this.membership.requireOrg(userId);
    const r = await this.prisma.staffingRequirement.findFirst({ where: { id, orgId }, include: { assignments: true } });
    if (!r) throw ApiException.notFound('Requirement not found.');
    await this.prisma.staffingRequirement.update({ where: { id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
    await this.notifyAssigned(r.assignments.map((a) => a.personId), r.role, r.date);
    await this.events.emit('REQUIREMENT_PUBLISHED', userId, { orgId, requirementId: id });
    if (r.openMarketplace && r.requiredCount - activeCount(r.assignments) > 0) {
      await this.maybeCascade(orgId, userId, id);
    }
    return this.view(orgId, id);
  }

  async publishRange(userId: string, from: string, to: string): Promise<OkResponse> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.staffingRequirement.findMany({
      where: { orgId, date: { gte: from, lte: to }, status: { in: ['DRAFT', 'OPEN'] } },
      include: { assignments: true },
    });
    for (const r of rows) {
      await this.prisma.staffingRequirement.update({ where: { id: r.id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
      await this.notifyAssigned(r.assignments.map((a) => a.personId), r.role, r.date);
      if (r.openMarketplace && r.requiredCount - activeCount(r.assignments) > 0) {
        await this.maybeCascade(orgId, userId, r.id);
      }
    }
    await this.events.emit('REQUIREMENT_PUBLISHED', userId, { orgId, from, to, count: rows.length });
    return { ok: true };
  }

  async cascade(userId: string, id: string, channels?: string[]): Promise<StaffingRequirementView> {
    const { orgId } = await this.membership.requireOrg(userId);
    const config = await this.config.resolve(orgId);
    if (!config.modules.find((m) => m.key === 'marketplace' && m.enabled)) {
      throw ApiException.badRequest('VALIDATION_ERROR', 'Enable the Open-Shift Marketplace module in Roster Builder to cascade open shifts.');
    }
    await this.prisma.staffingRequirement.update({ where: { id }, data: { openMarketplace: true } });
    await this.runCascade(orgId, userId, id, channels);
    return this.view(orgId, id);
  }

  /** Best-effort cascade used on publish (never throws into the publish flow). */
  private async maybeCascade(orgId: string, userId: string, id: string): Promise<void> {
    const config = await this.config.resolve(orgId);
    if (!config.modules.find((m) => m.key === 'marketplace' && m.enabled)) return;
    await this.runCascade(orgId, userId, id);
  }

  private async runCascade(orgId: string, userId: string, id: string, channels?: string[]): Promise<void> {
    const r = await this.prisma.staffingRequirement.findFirst({ where: { id, orgId }, include: { assignments: true } });
    if (!r) return;
    const vacant = r.requiredCount - activeCount(r.assignments);
    const targets = (channels?.length ? channels : ['ON_CALL', 'CONTRACTORS', 'AGENCIES']) as DispatchChannel[];
    const dispatch = await this.prisma.dispatch.create({
      data: {
        orgId,
        message: `Open shift: ${r.role} on ${r.date} ${r.startTime}–${r.endTime}${r.locationText ? ` · ${r.locationText}` : ''}`,
        roleNeeded: r.role,
        headcount: vacant,
        whenAt: `${r.date} ${r.startTime}`,
        status: 'OPEN',
        targets: { create: targets.map((channel) => ({ channel })) },
      },
    });
    // Notify on-call workers' user accounts (best-effort).
    const onCall = await this.prisma.orgWorker.findMany({
      where: { orgId, active: true, onCall: true },
      include: { person: { select: { userId: true } } },
    });
    for (const w of onCall) {
      await this.notifications.notify(w.person.userId, {
        kind: 'open-shift',
        title: 'Open shift available',
        body: `${r.role} on ${r.date}, ${r.startTime}–${r.endTime}`,
        link: '/dashboard/shifts?tab=open',
      });
    }
    await this.events.emit('REQUIREMENT_CASCADED', userId, { orgId, requirementId: id, dispatchId: dispatch.id, vacant });
  }

  async openShifts(userId: string, q: { from?: string; to?: string }): Promise<OpenShift[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.staffingRequirement.findMany({
      where: { orgId, status: 'PUBLISHED', ...dateFilter(q) },
      include: { assignments: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    return rows
      .map((r) => ({
        requirementId: r.id,
        date: r.date,
        startTime: r.startTime,
        endTime: r.endTime,
        role: r.role,
        category: r.category,
        locationText: r.locationText,
        client: r.client,
        vacant: r.requiredCount - activeCount(r.assignments),
      }))
      .filter((o) => o.vacant > 0);
  }

  /** A worker claims a vacant, marketplace-offered open shift. */
  async claim(userId: string, id: string): Promise<StaffingRequirementView> {
    const personId = await this.membership.requirePerson(userId);
    const r = await this.prisma.staffingRequirement.findUnique({ where: { id }, include: { assignments: true } });
    if (!r) throw ApiException.notFound('Shift not found.');
    if (r.status !== 'PUBLISHED' || !r.openMarketplace) {
      throw ApiException.badRequest('VALIDATION_ERROR', 'This shift is not open for claiming.');
    }
    const already = r.assignments.some((a) => a.personId === personId);
    if (!already && r.requiredCount - activeCount(r.assignments) <= 0) {
      throw ApiException.badRequest('VALIDATION_ERROR', 'This shift is already full.');
    }
    const source = await this.inferSource(r.orgId, personId);
    await this.prisma.requirementAssignment.upsert({
      where: { requirementId_personId: { requirementId: id, personId } },
      update: { status: 'ASSIGNED', source },
      create: { requirementId: id, personId, source, status: 'ASSIGNED' },
    });
    return this.view(r.orgId, id);
  }

  // ---- worker-facing (job-seeker app; person-scoped) -----------------------

  /** The shifts the logged-in worker is rostered on (recent + upcoming). */
  async myShifts(userId: string): Promise<MyShiftView[]> {
    const personId = await this.membership.requirePerson(userId);
    const since = addDaysISO(new Date().toISOString().slice(0, 10), -2);
    const assigns = await this.prisma.requirementAssignment.findMany({
      where: { personId, requirement: { date: { gte: since } } },
      include: { requirement: true },
    });
    const orgIds = [...new Set(assigns.map((a) => a.requirement.orgId))];
    const orgs = orgIds.length
      ? await this.prisma.organisation.findMany({ where: { id: { in: orgIds } }, select: { id: true, name: true } })
      : [];
    const orgName = new Map(orgs.map((o) => [o.id, o.name]));
    return assigns
      .map((a) => ({
        assignmentId: a.id,
        requirementId: a.requirementId,
        status: a.status,
        orgName: orgName.get(a.requirement.orgId) ?? 'Employer',
        role: a.requirement.role,
        category: a.requirement.category,
        date: a.requirement.date,
        startTime: a.requirement.startTime,
        endTime: a.requirement.endTime,
        locationText: a.requirement.locationText,
        client: a.requirement.client,
      }))
      .sort((x, y) => x.date.localeCompare(y.date) || x.startTime.localeCompare(y.startTime));
  }

  /** The worker accepts/declines/confirms their OWN assignment. */
  async respondAsWorker(userId: string, assignmentId: string, body: PlannerRespondData): Promise<OkResponse> {
    const personId = await this.membership.requirePerson(userId);
    const a = await this.prisma.requirementAssignment.findUnique({ where: { id: assignmentId }, select: { id: true, personId: true } });
    if (!a || a.personId !== personId) throw ApiException.notFound('Shift not found.');
    await this.prisma.requirementAssignment.update({ where: { id: assignmentId }, data: { status: body.response } });
    return { ok: true };
  }

  /** Open (cascaded) shifts the worker can claim — from orgs whose pool they're in. */
  async marketplace(userId: string): Promise<MarketplaceShift[]> {
    const personId = await this.membership.requirePerson(userId);
    const pool = await this.prisma.orgWorker.findMany({ where: { personId, active: true }, select: { orgId: true } });
    const orgIds = pool.map((p) => p.orgId);
    if (orgIds.length === 0) return [];
    const [reqs, orgs] = await Promise.all([
      this.prisma.staffingRequirement.findMany({
        where: { orgId: { in: orgIds }, status: 'PUBLISHED', openMarketplace: true },
        include: { assignments: true },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      }),
      this.prisma.organisation.findMany({ where: { id: { in: orgIds } }, select: { id: true, name: true } }),
    ]);
    const orgName = new Map(orgs.map((o) => [o.id, o.name]));
    return reqs
      .filter((r) => r.requiredCount - activeCount(r.assignments) > 0 && !r.assignments.some((a) => a.personId === personId && ACTIVE_ASSIGNMENT.includes(a.status)))
      .map((r) => ({
        requirementId: r.id,
        orgName: orgName.get(r.orgId) ?? 'Employer',
        date: r.date,
        startTime: r.startTime,
        endTime: r.endTime,
        role: r.role,
        category: r.category,
        locationText: r.locationText,
        client: r.client,
        vacant: r.requiredCount - activeCount(r.assignments),
      }));
  }

  // ---- grid + who's turning up ---------------------------------------------

  async grid(userId: string, weekStart: string, dayCount = 7): Promise<RosterWeek> {
    const { orgId } = await this.membership.requireOrg(userId);
    const days = Array.from({ length: dayCount }, (_, i) => addDaysISO(weekStart, i));
    const [reqs, leaves, available, orgProfile, config] = await Promise.all([
      this.prisma.staffingRequirement.findMany({
        where: { orgId, date: { gte: days[0], lte: days[days.length - 1] } },
        include: { assignments: true },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      }),
      this.prisma.leaveRequest.findMany({ where: { orgId, status: 'APPROVED' } }),
      this.prisma.orgWorker.count({ where: { orgId, active: true } }),
      this.prisma.orgProfile.findUnique({ where: { orgId }, select: { state: true } }),
      this.config.resolve(orgId),
    ]);
    const persons = await this.personsFor(reqs);
    const assignedIds = [...persons.keys()];
    const workers = assignedIds.length
      ? await this.prisma.orgWorker.findMany({
          where: { orgId, personId: { in: assignedIds } },
          select: { personId: true, source: true, teamId: true, onCall: true, urgentAvailable: true, availabilityNote: true },
        })
      : [];
    const workerBy = new Map(workers.map((w) => [w.personId, w]));
    const ctx = await this.loadConflictData(orgId, assignedIds);

    const rowMap = new Map<string, RosterGridRow>();
    const openByDate: Record<string, RosterOpenCell[]> = {};
    const perWorkerWeek = new Map<string, number>();
    let required = 0;
    let assigned = 0;
    let hours = 0;
    let estPayroll = 0;
    let openShifts = 0;

    for (const r of reqs) {
      required += r.requiredCount;
      const act = activeCount(r.assignments);
      assigned += act;
      const h = shiftHours(r.startTime, r.endTime);
      hours += h * act;
      estPayroll += (r.payRate ?? 0) * h * act;

      for (const a of r.assignments) {
        if (!ACTIVE_ASSIGNMENT.includes(a.status)) continue;
        const p = persons.get(a.personId);
        const name = p?.name ?? '(unknown)';
        let row = rowMap.get(a.personId);
        if (!row) {
          const w = workerBy.get(a.personId);
          row = {
            personId: a.personId,
            waId: p?.waId ?? null,
            name,
            source: w?.source ?? null,
            teamId: w?.teamId ?? null,
            onCall: w?.onCall ?? false,
            urgentAvailable: w?.urgentAvailable ?? false,
            availabilityNote: w?.availabilityNote ?? null,
            hours: 0,
            shifts: 0,
            estPay: 0,
            cellsByDate: {},
          };
          rowMap.set(a.personId, row);
        }
        const { busy, weekHours } = busyAndWeekHours(ctx.assignmentsBy.get(a.personId) ?? [], r.date, r.id);
        const conflicts = this.conflict
          .conflicts({
            date: r.date,
            start: r.startTime,
            end: r.endTime,
            gates: config.gates,
            personName: name,
            busyIntervals: busy,
            leaves: ctx.leaves,
            credentials: ctx.credsBy.get(a.personId) ?? [],
            weekHours,
          })
          .map((c) => c.kind);
        const cells = row.cellsByDate[r.date] ?? [];
        cells.push({
          requirementId: r.id,
          assignmentId: a.id,
          role: r.role,
          category: r.category,
          startTime: r.startTime,
          endTime: r.endTime,
          locationText: r.locationText,
          status: r.status,
          conflicts,
        });
        row.cellsByDate[r.date] = cells;
        row.hours += h;
        row.shifts += 1;
        row.estPay += (r.payRate ?? 0) * h;
        const wk = `${a.personId}|${isoWeekKey(r.date)}`;
        perWorkerWeek.set(wk, (perWorkerWeek.get(wk) ?? 0) + h);
      }

      const vacant = r.requiredCount - act;
      if (vacant > 0) {
        openShifts += 1;
        const list = openByDate[r.date] ?? [];
        list.push({ requirementId: r.id, role: r.role, category: r.category, startTime: r.startTime, endTime: r.endTime, locationText: r.locationText, vacant });
        openByDate[r.date] = list;
      }
    }

    const leaveByDate: Record<string, RosterLeaveCell[]> = {};
    for (const d of days) {
      for (const l of leaves) {
        if (d >= l.startDate && d <= l.endDate) {
          const list = leaveByDate[d] ?? [];
          list.push({ name: l.personName, type: l.type });
          leaveByDate[d] = list;
        }
      }
    }

    for (const row of rowMap.values()) {
      row.hours = Math.round(row.hours);
      row.estPay = Math.round(row.estPay);
    }
    const rows = [...rowMap.values()].sort((a, b) => a.name.localeCompare(b.name));
    const leaveCount = leaves.filter((l) => days.some((d) => d >= l.startDate && d <= l.endDate)).length;
    const holidaysByDate = holidaysForDates(days, orgProfile?.state ?? null);
    let overtime = 0;
    for (const wh of perWorkerWeek.values()) overtime += Math.max(0, wh - OVERTIME_THRESHOLD_HOURS);

    return {
      weekStart,
      days,
      rows,
      openByDate,
      leaveByDate,
      holidaysByDate,
      summary: {
        required,
        assigned,
        vacant: Math.max(0, required - assigned),
        leave: leaveCount,
        overtime: Math.round(overtime),
        available,
        hours: Math.round(hours),
        estPayroll: Math.round(estPayroll),
        employees: available,
        openShifts,
        publicHolidays: Object.keys(holidaysByDate).length,
      },
    };
  }

  /** Who's Turning Up — merges planner requirement assignments with legacy roster shifts. */
  async turnup(userId: string, q: { from?: string; to?: string }): Promise<WhosTurningUpDay[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const byDate = new Map<string, RosterAssignment[]>();
    const push = (date: string, a: RosterAssignment) => {
      const list = byDate.get(date) ?? [];
      list.push(a);
      byDate.set(date, list);
    };

    const reqs = await this.prisma.staffingRequirement.findMany({ where: { orgId, ...dateFilter(q) }, include: { assignments: true } });
    const persons = await this.personsFor(reqs);
    for (const r of reqs) {
      for (const a of r.assignments) {
        const p = persons.get(a.personId);
        push(r.date, { id: a.id, waId: p?.waId ?? '', name: p?.name ?? '(unknown)', status: a.status });
      }
    }

    const shifts = await this.prisma.shift.findMany({
      where: { orgId, isRoster: true },
      include: { assignments: { include: { person: { select: { waId: true, firstName: true, lastName: true } } } } },
    });
    for (const s of shifts) {
      const date = s.startAt.toISOString().slice(0, 10);
      if (q.from && date < q.from) continue;
      if (q.to && date > q.to) continue;
      for (const a of s.assignments) push(date, { id: a.id, waId: a.person.waId, name: nameOf(a.person), status: a.status });
    }

    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, assignments]) => ({
        date,
        confirmed: assignments.filter((x) => ['ACCEPTED', 'CONFIRMED', 'COMPLETED'].includes(x.status)).length,
        pending: assignments.filter((x) => x.status === 'ASSIGNED').length,
        declined: assignments.filter((x) => ['DECLINED', 'NO_SHOW'].includes(x.status)).length,
        assignments,
      }));
  }

  /** Per-day forecast for the roster week (gated by the Weather module). */
  async weather(userId: string, weekStart: string): Promise<WeatherDay[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const config = await this.config.resolve(orgId);
    if (!config.modules.find((m) => m.key === 'weather' && m.enabled)) return [];
    const site = await this.prisma.site.findFirst({ where: { orgId, active: true }, select: { suburb: true, state: true } });
    let suburb = site?.suburb ?? null;
    let state = site?.state ?? null;
    if (!suburb) {
      const p = await this.prisma.orgProfile.findUnique({ where: { orgId }, select: { suburb: true, state: true } });
      suburb = p?.suburb ?? null;
      state = p?.state ?? null;
    }
    if (!suburb) return [];
    return this.weatherService.forecast(suburb, state, weekStart);
  }

  /** Staff view — all active workers + their week rollup (hours/shifts/pay). */
  async staffCards(userId: string, weekStart: string): Promise<RosterStaffCard[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const days = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));
    const workers = await this.prisma.orgWorker.findMany({
      where: { orgId, active: true },
      include: {
        person: { select: { id: true, waId: true, firstName: true, lastName: true, profile: { select: { skills: true } } } },
      },
    });
    const personIds = workers.map((w) => w.personId);
    if (personIds.length === 0) return [];
    const [reqAssigns, creds] = await Promise.all([
      this.prisma.requirementAssignment.findMany({
        where: { personId: { in: personIds }, status: { in: ACTIVE_ASSIGNMENT }, requirement: { orgId, date: { gte: days[0], lte: days[6] } } },
        include: { requirement: { select: { startTime: true, endTime: true, payRate: true } } },
      }),
      this.prisma.credential.findMany({ where: { personId: { in: personIds } }, select: { personId: true, type: true, identifier: true } }),
    ]);
    const roll = new Map<string, { hours: number; shifts: number; estPay: number }>();
    for (const a of reqAssigns) {
      const h = shiftHours(a.requirement.startTime, a.requirement.endTime);
      const r = roll.get(a.personId) ?? { hours: 0, shifts: 0, estPay: 0 };
      r.hours += h;
      r.shifts += 1;
      r.estPay += (a.requirement.payRate ?? 0) * h;
      roll.set(a.personId, r);
    }
    const visaBy = new Map<string, string>();
    for (const c of creds) {
      if (!c.personId) continue;
      if (/visa|right.?to.?work/i.test(c.type)) visaBy.set(c.personId, c.identifier ?? c.type);
    }
    return workers
      .map((w) => {
        const p = w.person;
        const r = roll.get(w.personId) ?? { hours: 0, shifts: 0, estPay: 0 };
        const availability = w.urgentAvailable ? 'Urgent-ready' : w.onCall ? 'On-call' : w.availabilityNote ?? 'Available';
        return {
          personId: w.personId,
          waId: p.waId,
          name: nameOf(p),
          source: w.source,
          role: w.staffType ?? null,
          skills: p.profile?.skills ?? null,
          visa: visaBy.get(w.personId) ?? null,
          hours: Math.round(r.hours),
          shifts: r.shifts,
          estPay: Math.round(r.estPay),
          availability,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private async notifyAssigned(personIds: string[], role: string, date: string): Promise<void> {
    if (personIds.length === 0) return;
    const persons = await this.prisma.person.findMany({ where: { id: { in: personIds } }, select: { userId: true } });
    for (const p of persons) {
      await this.notifications.notify(p.userId, {
        kind: 'roster',
        title: 'You’re rostered',
        body: `${role} on ${date} — published to your shifts.`,
        link: '/dashboard/work?tab=shifts',
      });
    }
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

type AssignmentLite = { requirementId: string | null; date: string; start: string; end: string };

/** Busy intervals on `date` + total hours that ISO week, excluding one requirement. */
function busyAndWeekHours(
  assignments: AssignmentLite[],
  date: string,
  excludeRequirementId: string | null,
): { busy: { start: string; end: string }[]; weekHours: number } {
  const weekKey = isoWeekKey(date);
  const busy: { start: string; end: string }[] = [];
  let weekHours = 0;
  for (const a of assignments) {
    if (excludeRequirementId && a.requirementId === excludeRequirementId) continue;
    if (a.date === date) busy.push({ start: a.start, end: a.end });
    if (isoWeekKey(a.date) === weekKey) weekHours += shiftHours(a.start, a.end);
  }
  return { busy, weekHours };
}

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
