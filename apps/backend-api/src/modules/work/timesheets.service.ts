import { Injectable } from '@nestjs/common';
import type { TimesheetStatus, TimesheetView } from '@workarmy/types';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { ApiException } from '../../common/errors/api-exception';

function currentWeek(): { weekStart: string; start: Date; end: Date } {
  const now = new Date();
  const diff = (now.getUTCDay() + 6) % 7; // days since Monday
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { weekStart: start.toISOString().slice(0, 10), start, end };
}

function hoursBetween(inAt: Date, outAt: Date, breakMins: number): number {
  const hrs = (outAt.getTime() - inAt.getTime()) / 3_600_000 - (breakMins || 0) / 60;
  return Math.max(0, Math.round(hrs * 100) / 100);
}

const personName = (p: { firstName: string | null; lastName: string | null; waId: string }): string =>
  `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.waId;

@Injectable()
export class TimesheetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  async mine(userId: string): Promise<TimesheetView[]> {
    const personId = await this.membership.requirePerson(userId);
    const rows = await this.prisma.timesheet.findMany({
      where: { personId },
      orderBy: { weekStart: 'desc' },
      include: { entries: true, organisation: true },
    });
    return rows.map((t) => ({
      id: t.id,
      weekStart: t.weekStart,
      status: t.status,
      totalHours: t.totalHours,
      createdAt: t.createdAt.toISOString(),
      org: { name: t.organisation.name },
      entries: t.entries.map((e) => ({ id: e.id, date: e.date, hours: e.hours, note: e.note })),
    }));
  }

  async generate(userId: string): Promise<TimesheetView> {
    const personId = await this.membership.requirePerson(userId);
    const { weekStart, start, end } = currentWeek();
    const assignments = await this.prisma.shiftAssignment.findMany({
      where: {
        personId,
        attendance: { clockInAt: { gte: start, lt: end }, clockOutAt: { not: null } },
      },
      include: { attendance: true, shift: true },
    });
    if (assignments.length === 0) {
      throw ApiException.badRequest('VALIDATION_ERROR', 'No completed shifts to add for this week.');
    }
    // A timesheet belongs to one org — use the org of the first completed shift.
    const orgId = assignments[0].shift.orgId;
    const forOrg = assignments.filter((a) => a.shift.orgId === orgId);
    const entries = forOrg.map((a) => ({
      shiftId: a.shiftId,
      date: a.attendance!.clockInAt!.toISOString().slice(0, 10),
      hours: hoursBetween(a.attendance!.clockInAt!, a.attendance!.clockOutAt!, a.shift.breakMinutes),
      note: a.shift.title,
    }));
    const total = Math.round(entries.reduce((s, e) => s + e.hours, 0) * 100) / 100;

    const existing = await this.prisma.timesheet.findFirst({ where: { personId, orgId, weekStart } });
    const ts = existing
      ? await this.prisma.timesheet.update({
          where: { id: existing.id },
          data: {
            status: 'SUBMITTED',
            totalHours: total,
            entries: { deleteMany: {}, create: entries },
          },
          include: { entries: true, organisation: true },
        })
      : await this.prisma.timesheet.create({
          data: { personId, orgId, weekStart, status: 'SUBMITTED', totalHours: total, entries: { create: entries } },
          include: { entries: true, organisation: true },
        });

    return {
      id: ts.id,
      weekStart: ts.weekStart,
      status: ts.status,
      totalHours: ts.totalHours,
      createdAt: ts.createdAt.toISOString(),
      org: { name: ts.organisation.name },
      entries: ts.entries.map((e) => ({ id: e.id, date: e.date, hours: e.hours, note: e.note })),
    };
  }

  async forOrg(userId: string, status?: TimesheetStatus): Promise<TimesheetView[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.timesheet.findMany({
      where: { orgId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { entries: true, person: true },
    });
    return rows.map((t) => ({
      id: t.id,
      weekStart: t.weekStart,
      status: t.status,
      totalHours: t.totalHours,
      createdAt: t.createdAt.toISOString(),
      person: { waId: t.person.waId, name: personName(t.person) },
      entries: t.entries.map((e) => ({ id: e.id, date: e.date, hours: e.hours, note: e.note })),
    }));
  }

  async setStatus(userId: string, id: string, status: 'APPROVED' | 'REJECTED'): Promise<{ ok: true }> {
    const { orgId } = await this.membership.requireOrg(userId);
    const t = await this.prisma.timesheet.findFirst({ where: { id, orgId }, select: { id: true } });
    if (!t) throw ApiException.notFound('Timesheet not found.');
    await this.prisma.timesheet.update({ where: { id }, data: { status } });
    return { ok: true as const };
  }
}
