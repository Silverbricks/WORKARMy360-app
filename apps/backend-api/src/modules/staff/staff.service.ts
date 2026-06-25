import { Injectable } from '@nestjs/common';
import type {
  OrgWorker,
  RosterShift,
  Team,
  WhosTurningUpDay,
  WorkerDirectoryItem,
} from '@workarmy/types';
import type {
  OrgWorkerInputData,
  OrgWorkerUpdateData,
  RosterInputData,
  TeamInputData,
  TeamMemberInputData,
  WorkerDirectoryQueryData,
} from '@workarmy/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ApiException } from '../../common/errors/api-exception';

type PersonName = { id: string; userId: string; waId: string; firstName: string | null; lastName: string | null };
const nameOf = (p: { firstName: string | null; lastName: string | null; waId: string }) =>
  `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.waId;

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
    private readonly notifications: NotificationsService,
  ) {}

  private async personByWaId(waId: string): Promise<PersonName> {
    const person = await this.prisma.person.findUnique({
      where: { waId: waId.trim() },
      select: { id: true, userId: true, waId: true, firstName: true, lastName: true },
    });
    if (!person) throw ApiException.badRequest('VALIDATION_ERROR', `No worker found for ${waId}.`);
    return person;
  }

  // ---- Org workers ---------------------------------------------------------
  async listWorkers(
    userId: string,
    q: { onCall?: boolean; urgent?: boolean; staffType?: string },
  ): Promise<OrgWorker[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.orgWorker.findMany({
      where: {
        orgId,
        ...(q.onCall ? { onCall: true } : {}),
        ...(q.urgent ? { urgentAvailable: true } : {}),
        ...(q.staffType ? { staffType: q.staffType } : {}),
      },
      include: { person: { select: { waId: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((w) => ({
      id: w.id,
      personId: w.personId,
      waId: w.person.waId,
      name: nameOf(w.person),
      staffType: w.staffType,
      onCall: w.onCall,
      urgentAvailable: w.urgentAvailable,
      availabilityNote: w.availabilityNote,
      teamId: w.teamId,
      active: w.active,
    }));
  }

  async addWorker(userId: string, input: OrgWorkerInputData): Promise<OrgWorker> {
    const { orgId } = await this.membership.requireOrg(userId);
    const person = await this.personByWaId(input.waId);
    const w = await this.prisma.orgWorker.upsert({
      where: { orgId_personId: { orgId, personId: person.id } },
      update: {
        staffType: input.staffType ?? null,
        onCall: input.onCall ?? false,
        urgentAvailable: input.urgentAvailable ?? false,
        availabilityNote: input.availabilityNote ?? null,
        active: true,
      },
      create: {
        orgId,
        personId: person.id,
        staffType: input.staffType ?? null,
        onCall: input.onCall ?? false,
        urgentAvailable: input.urgentAvailable ?? false,
        availabilityNote: input.availabilityNote ?? null,
      },
    });
    return {
      id: w.id,
      personId: w.personId,
      waId: person.waId,
      name: nameOf(person),
      staffType: w.staffType,
      onCall: w.onCall,
      urgentAvailable: w.urgentAvailable,
      availabilityNote: w.availabilityNote,
      teamId: w.teamId,
      active: w.active,
    };
  }

  async updateWorker(userId: string, id: string, input: OrgWorkerUpdateData): Promise<OrgWorker> {
    const { orgId } = await this.membership.requireOrg(userId);
    const existing = await this.prisma.orgWorker.findFirst({ where: { id, orgId }, select: { id: true } });
    if (!existing) throw ApiException.notFound('Worker not found.');
    const w = await this.prisma.orgWorker.update({
      where: { id },
      data: {
        staffType: input.staffType,
        onCall: input.onCall,
        urgentAvailable: input.urgentAvailable,
        availabilityNote: input.availabilityNote,
        teamId: input.teamId,
        active: input.active,
      },
      include: { person: { select: { waId: true, firstName: true, lastName: true } } },
    });
    return {
      id: w.id,
      personId: w.personId,
      waId: w.person.waId,
      name: nameOf(w.person),
      staffType: w.staffType,
      onCall: w.onCall,
      urgentAvailable: w.urgentAvailable,
      availabilityNote: w.availabilityNote,
      teamId: w.teamId,
      active: w.active,
    };
  }

  async removeWorker(userId: string, id: string): Promise<{ ok: true }> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.prisma.orgWorker.deleteMany({ where: { id, orgId } });
    return { ok: true as const };
  }

  // ---- Teams ---------------------------------------------------------------
  async listTeams(userId: string): Promise<Team[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const teams = await this.prisma.team.findMany({
      where: { orgId },
      include: {
        members: { include: { person: { select: { waId: true, firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return teams.map(toTeam);
  }

  async createTeam(userId: string, input: TeamInputData): Promise<Team> {
    const { orgId } = await this.membership.requireOrg(userId);
    const team = await this.prisma.team.create({
      data: {
        orgId,
        name: input.name,
        description: input.description ?? null,
        supervisorMemberId: input.supervisorMemberId ?? null,
      },
      include: { members: { include: { person: { select: { waId: true, firstName: true, lastName: true } } } } },
    });
    return toTeam(team);
  }

  async removeTeam(userId: string, id: string): Promise<{ ok: true }> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.prisma.team.deleteMany({ where: { id, orgId } });
    return { ok: true as const };
  }

  async addTeamMember(userId: string, teamId: string, input: TeamMemberInputData): Promise<Team> {
    const { orgId } = await this.membership.requireOrg(userId);
    const team = await this.prisma.team.findFirst({ where: { id: teamId, orgId }, select: { id: true } });
    if (!team) throw ApiException.notFound('Team not found.');
    const person = await this.personByWaId(input.waId);
    await this.prisma.teamMember.upsert({
      where: { teamId_personId: { teamId, personId: person.id } },
      update: { roleInTeam: input.roleInTeam ?? null },
      create: { teamId, personId: person.id, roleInTeam: input.roleInTeam ?? null },
    });
    return this.getTeam(teamId);
  }

  async removeTeamMember(userId: string, teamId: string, memberId: string): Promise<Team> {
    const { orgId } = await this.membership.requireOrg(userId);
    const team = await this.prisma.team.findFirst({ where: { id: teamId, orgId }, select: { id: true } });
    if (!team) throw ApiException.notFound('Team not found.');
    await this.prisma.teamMember.deleteMany({ where: { id: memberId, teamId } });
    return this.getTeam(teamId);
  }

  private async getTeam(id: string): Promise<Team> {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { members: { include: { person: { select: { waId: true, firstName: true, lastName: true } } } } },
    });
    if (!team) throw ApiException.notFound('Team not found.');
    return toTeam(team);
  }

  // ---- Worker directory (Find Job Seekers) ---------------------------------
  async browseDirectory(userId: string, q: WorkerDirectoryQueryData): Promise<WorkerDirectoryItem[]> {
    await this.membership.requireOrg(userId);
    const rows = await this.prisma.personProfile.findMany({
      where: {
        cardPublished: true,
        ...(q.state ? { state: q.state } : {}),
        ...(q.workType ? { cardWorkType: q.workType } : {}),
        ...(q.urgent ? { cardUrgentShifts: true } : {}),
        ...(q.q
          ? {
              OR: [
                { headline: { contains: q.q, mode: 'insensitive' as const } },
                { skills: { contains: q.q, mode: 'insensitive' as const } },
                { cardQualification: { contains: q.q, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      include: { person: { select: { waId: true, firstName: true, lastName: true } } },
      take: 100,
    });
    return rows.map((p) => ({
      waId: p.person.waId,
      name: nameOf(p.person),
      headline: p.headline,
      skills: p.skills,
      state: p.state,
      suburb: p.suburb,
      availability: p.availability,
      workType: p.cardWorkType,
      availableFrom: p.cardAvailableFrom,
      urgentShifts: p.cardUrgentShifts,
      qualification: p.cardQualification,
    }));
  }

  async invite(userId: string, waId: string, message?: string): Promise<{ ok: true }> {
    const { orgId } = await this.membership.requireOrg(userId);
    const org = await this.prisma.organisation.findUnique({ where: { id: orgId }, select: { name: true } });
    const person = await this.personByWaId(waId);
    await this.notifications.notify(person.userId, {
      kind: 'invite',
      title: `${org?.name ?? 'A business'} invited you to work`,
      body: message?.trim() || 'Open your dashboard to view the opportunity.',
      link: '/dashboard/jobs',
    });
    return { ok: true as const };
  }

  // ---- Rosters (reuse Shift + ShiftAssignment) -----------------------------
  async listRosters(userId: string): Promise<RosterShift[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const shifts = await this.prisma.shift.findMany({
      where: { orgId, isRoster: true },
      include: {
        assignments: { include: { person: { select: { waId: true, firstName: true, lastName: true } } } },
      },
      orderBy: { startAt: 'asc' },
    });
    return shifts.map(toRoster);
  }

  async createRoster(userId: string, input: RosterInputData): Promise<RosterShift> {
    const { orgId } = await this.membership.requireOrg(userId);
    const startAt = new Date(`${input.date}T${input.start}:00Z`);
    const endAt = new Date(`${input.date}T${input.end}:00Z`);
    const personIds: string[] = [];
    for (const waId of input.waIds ?? []) {
      const p = await this.personByWaId(waId);
      personIds.push(p.id);
    }
    const shift = await this.prisma.shift.create({
      data: {
        orgId,
        title: input.title,
        startAt,
        endAt,
        isRoster: true,
        teamId: input.teamId ?? null,
        assignments: { create: personIds.map((personId) => ({ personId, status: 'ASSIGNED' as const })) },
      },
      include: {
        assignments: { include: { person: { select: { waId: true, firstName: true, lastName: true } } } },
      },
    });
    return toRoster(shift);
  }

  async assignRoster(userId: string, shiftId: string, waId: string): Promise<RosterShift> {
    const { orgId } = await this.membership.requireOrg(userId);
    const shift = await this.prisma.shift.findFirst({ where: { id: shiftId, orgId }, select: { id: true } });
    if (!shift) throw ApiException.notFound('Roster shift not found.');
    const person = await this.personByWaId(waId);
    await this.prisma.shiftAssignment.upsert({
      where: { shiftId_personId: { shiftId, personId: person.id } },
      update: {},
      create: { shiftId, personId: person.id, status: 'ASSIGNED' },
    });
    return this.getRoster(shiftId);
  }

  async respondRoster(
    userId: string,
    assignmentId: string,
    response: 'ACCEPTED' | 'DECLINED' | 'CONFIRMED',
  ): Promise<RosterShift> {
    const { orgId } = await this.membership.requireOrg(userId);
    const a = await this.prisma.shiftAssignment.findUnique({
      where: { id: assignmentId },
      include: { shift: { select: { id: true, orgId: true } } },
    });
    if (!a || a.shift.orgId !== orgId) throw ApiException.notFound('Assignment not found.');
    await this.prisma.shiftAssignment.update({ where: { id: assignmentId }, data: { status: response } });
    return this.getRoster(a.shift.id);
  }

  async publishRoster(userId: string, shiftId: string): Promise<RosterShift> {
    const { orgId } = await this.membership.requireOrg(userId);
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, orgId },
      include: { assignments: { include: { person: { select: { userId: true } } } } },
    });
    if (!shift) throw ApiException.notFound('Roster shift not found.');
    await this.prisma.shift.update({ where: { id: shiftId }, data: { publishedAt: new Date() } });
    for (const a of shift.assignments) {
      await this.notifications.notify(a.person.userId, {
        kind: 'roster',
        title: 'New rostered shift',
        body: `You've been rostered for "${shift.title}". Accept or decline in your app.`,
        link: '/dashboard/work?tab=shifts',
      });
    }
    return this.getRoster(shiftId);
  }

  async turnup(userId: string): Promise<WhosTurningUpDay[]> {
    const rosters = await this.listRosters(userId);
    const byDate = new Map<string, RosterShift['assignments']>();
    for (const r of rosters) {
      const list = byDate.get(r.date) ?? [];
      list.push(...r.assignments);
      byDate.set(r.date, list);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, assignments]) => ({
        date,
        confirmed: assignments.filter((x) => ['ACCEPTED', 'CONFIRMED', 'COMPLETED'].includes(x.status)).length,
        pending: assignments.filter((x) => ['ASSIGNED'].includes(x.status)).length,
        declined: assignments.filter((x) => ['DECLINED', 'NO_SHOW'].includes(x.status)).length,
        assignments,
      }));
  }

  private async getRoster(id: string): Promise<RosterShift> {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: {
        assignments: { include: { person: { select: { waId: true, firstName: true, lastName: true } } } },
      },
    });
    if (!shift) throw ApiException.notFound('Roster shift not found.');
    return toRoster(shift);
  }
}

type DbTeam = {
  id: string;
  name: string;
  description: string | null;
  supervisorMemberId: string | null;
  members: { id: string; personId: string; roleInTeam: string | null; person: { waId: string; firstName: string | null; lastName: string | null } }[];
};
function toTeam(t: DbTeam): Team {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    supervisorMemberId: t.supervisorMemberId,
    members: t.members.map((m) => ({
      id: m.id,
      personId: m.personId,
      waId: m.person.waId,
      name: nameOf(m.person),
      roleInTeam: m.roleInTeam,
    })),
  };
}

type DbRoster = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  teamId: string | null;
  publishedAt: Date | null;
  assignments: { id: string; status: string; person: { waId: string; firstName: string | null; lastName: string | null } }[];
};
function toRoster(s: DbRoster): RosterShift {
  const sIso = s.startAt.toISOString();
  const eIso = s.endAt.toISOString();
  return {
    id: s.id,
    title: s.title,
    date: sIso.slice(0, 10),
    start: sIso.slice(11, 16),
    end: eIso.slice(11, 16),
    teamId: s.teamId,
    published: !!s.publishedAt,
    assignments: s.assignments.map((a) => ({
      id: a.id,
      waId: a.person.waId,
      name: nameOf(a.person),
      status: a.status,
    })),
  };
}
