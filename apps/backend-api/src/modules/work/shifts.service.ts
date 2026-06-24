import { Injectable } from '@nestjs/common';
import type {
  AssignmentView,
  AttendanceView,
  Shift,
  ShiftWithAssignments,
  WorkerShift,
} from '@workarmy/types';
import type { Shift as DbShift } from '@workarmy/database';
import type { ShiftInputData, ClockInputData } from '@workarmy/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { WorkReadinessService } from '../work-readiness/work-readiness.service';
import { ApiException } from '../../common/errors/api-exception';

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);

@Injectable()
export class ShiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
    private readonly workReadiness: WorkReadinessService,
  ) {}

  // --- provider ---
  async create(userId: string, input: ShiftInputData): Promise<Shift> {
    const { orgId } = await this.membership.requireOrg(userId);
    const shift = await this.prisma.shift.create({
      data: {
        orgId,
        title: input.title,
        jobId: input.jobId || null,
        location: input.location || null,
        suburb: input.suburb || null,
        state: input.state || null,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
        breakMinutes: input.breakMinutes ?? 0,
        payRate: input.payRate ?? null,
        payUnit: input.payUnit || null,
        positions: input.positions ?? 1,
        notes: input.notes || null,
      },
    });
    return toShift(shift);
  }

  async list(userId: string): Promise<ShiftWithAssignments[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const shifts = await this.prisma.shift.findMany({
      where: { orgId },
      orderBy: { startAt: 'desc' },
      include: { assignments: { include: { person: true, attendance: true } } },
    });
    return shifts.map((s) => ({
      ...toShift(s),
      assignments: s.assignments.map((a) => ({
        id: a.id,
        status: a.status,
        person: { waId: a.person.waId, firstName: a.person.firstName, lastName: a.person.lastName },
        attendance: a.attendance
          ? { clockInAt: iso(a.attendance.clockInAt), clockOutAt: iso(a.attendance.clockOutAt) }
          : null,
      })),
    }));
  }

  async cancel(userId: string, id: string): Promise<Shift> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.ensureOwned(id, orgId);
    return toShift(await this.prisma.shift.update({ where: { id }, data: { status: 'CANCELLED' } }));
  }

  async assign(userId: string, shiftId: string, waId: string): Promise<AssignmentView> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.ensureOwned(shiftId, orgId);
    const person = await this.prisma.person.findUnique({ where: { waId } });
    if (!person) throw ApiException.badRequest('VALIDATION_ERROR', 'No worker with that WA ID.');
    const exists = await this.prisma.shiftAssignment.findUnique({
      where: { shiftId_personId: { shiftId, personId: person.id } },
    });
    if (exists) throw ApiException.badRequest('VALIDATION_ERROR', 'Worker already assigned.');
    const a = await this.prisma.shiftAssignment.create({
      data: { shiftId, personId: person.id },
      include: { person: true, attendance: true },
    });
    return {
      id: a.id,
      status: a.status,
      person: { waId: a.person.waId, firstName: a.person.firstName, lastName: a.person.lastName },
      attendance: null,
    };
  }

  async unassign(userId: string, assignmentId: string): Promise<{ ok: true }> {
    const { orgId } = await this.membership.requireOrg(userId);
    const a = await this.prisma.shiftAssignment.findUnique({
      where: { id: assignmentId },
      include: { shift: true },
    });
    if (!a || a.shift.orgId !== orgId) throw ApiException.notFound('Assignment not found.');
    await this.prisma.shiftAssignment.delete({ where: { id: assignmentId } });
    return { ok: true as const };
  }

  // --- worker ---
  async mine(userId: string): Promise<WorkerShift[]> {
    const personId = await this.membership.requirePerson(userId);
    const rows = await this.prisma.shiftAssignment.findMany({
      where: { personId },
      orderBy: { shift: { startAt: 'desc' } },
      include: { shift: { include: { organisation: true } }, attendance: true },
    });
    return rows.map((a) => ({
      assignmentId: a.id,
      status: a.status,
      shift: toShift(a.shift),
      org: { name: a.shift.organisation.name },
      attendance: a.attendance
        ? { clockInAt: iso(a.attendance.clockInAt), clockOutAt: iso(a.attendance.clockOutAt) }
        : null,
    }));
  }

  async confirm(userId: string, assignmentId: string): Promise<{ ok: true }> {
    const personId = await this.membership.requirePerson(userId);
    await this.requireOwn(personId, assignmentId);
    // Gate 3: must be work-ready before accepting a shift.
    if (!(await this.workReadiness.isWorkReady(personId))) {
      throw ApiException.badRequest(
        'VALIDATION_ERROR',
        'Complete Work Readiness before accepting shifts.',
      );
    }
    await this.prisma.shiftAssignment.update({ where: { id: assignmentId }, data: { status: 'CONFIRMED' } });
    return { ok: true as const };
  }

  async clockIn(userId: string, assignmentId: string, body: ClockInputData): Promise<AttendanceView> {
    const personId = await this.membership.requirePerson(userId);
    await this.requireOwn(personId, assignmentId);
    const att = await this.prisma.attendance.upsert({
      where: { assignmentId },
      update: { clockInAt: new Date(), clockInLat: body.lat ?? null, clockInLng: body.lng ?? null },
      create: { assignmentId, clockInAt: new Date(), clockInLat: body.lat ?? null, clockInLng: body.lng ?? null },
    });
    return { clockInAt: iso(att.clockInAt), clockOutAt: iso(att.clockOutAt) };
  }

  async clockOut(userId: string, assignmentId: string, body: ClockInputData): Promise<AttendanceView> {
    const personId = await this.membership.requirePerson(userId);
    await this.requireOwn(personId, assignmentId);
    const att = await this.prisma.attendance.upsert({
      where: { assignmentId },
      update: { clockOutAt: new Date(), clockOutLat: body.lat ?? null, clockOutLng: body.lng ?? null },
      create: { assignmentId, clockOutAt: new Date(), clockOutLat: body.lat ?? null, clockOutLng: body.lng ?? null },
    });
    await this.prisma.shiftAssignment.update({ where: { id: assignmentId }, data: { status: 'COMPLETED' } });
    return { clockInAt: iso(att.clockInAt), clockOutAt: iso(att.clockOutAt) };
  }

  async requestSwap(userId: string, assignmentId: string): Promise<{ ok: true }> {
    const personId = await this.membership.requirePerson(userId);
    await this.requireOwn(personId, assignmentId);
    await this.prisma.$transaction([
      this.prisma.shiftAssignment.update({ where: { id: assignmentId }, data: { status: 'SWAP_REQUESTED' } }),
      this.prisma.shiftSwapRequest.create({
        data: { assignmentId, requestedByPersonId: personId, status: 'OPEN' },
      }),
    ]);
    return { ok: true as const };
  }

  private async ensureOwned(shiftId: string, orgId: string): Promise<void> {
    const s = await this.prisma.shift.findFirst({ where: { id: shiftId, orgId }, select: { id: true } });
    if (!s) throw ApiException.notFound('Shift not found.');
  }

  private async requireOwn(personId: string, assignmentId: string) {
    const a = await this.prisma.shiftAssignment.findFirst({ where: { id: assignmentId, personId } });
    if (!a) throw ApiException.notFound('Assignment not found.');
    return a;
  }
}

function toShift(s: DbShift): Shift {
  return {
    id: s.id,
    title: s.title,
    jobId: s.jobId,
    location: s.location,
    suburb: s.suburb,
    state: s.state,
    startAt: s.startAt.toISOString(),
    endAt: s.endAt.toISOString(),
    breakMinutes: s.breakMinutes,
    payRate: s.payRate,
    payUnit: s.payUnit,
    positions: s.positions,
    notes: s.notes,
    status: s.status,
  };
}
