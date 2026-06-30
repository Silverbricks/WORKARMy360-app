import { Injectable } from '@nestjs/common';
import type { AssignmentStatus, DispatchChannel, Prisma } from '@workarmy/database';
import type {
  OkResponse,
  OpenShift,
  PlannerCandidate,
  PlannerSummary,
  RosterTemplateView,
  StaffingRequirementView,
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
import { PlannerConflictService, isoWeekKey } from './planner-conflict.service';

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
        link: '/dashboard/work?tab=shifts',
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

  /** A worker claims a vacant published open shift (thin marketplace). */
  async claim(userId: string, id: string): Promise<StaffingRequirementView> {
    const personId = await this.membership.requirePerson(userId);
    const r = await this.prisma.staffingRequirement.findUnique({ where: { id }, include: { assignments: true } });
    if (!r) throw ApiException.notFound('Shift not found.');
    if (r.status !== 'PUBLISHED') throw ApiException.badRequest('VALIDATION_ERROR', 'This shift is not open.');
    if (!r.assignments.some((a) => a.personId === personId) && r.requiredCount - activeCount(r.assignments) <= 0) {
      throw ApiException.badRequest('VALIDATION_ERROR', 'This shift is already full.');
    }
    await this.prisma.requirementAssignment.upsert({
      where: { requirementId_personId: { requirementId: id, personId } },
      update: { status: 'ASSIGNED', source: 'NEARBY' },
      create: { requirementId: id, personId, source: 'NEARBY', status: 'ASSIGNED' },
    });
    return this.view(r.orgId, id);
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
