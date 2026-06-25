import { Injectable } from '@nestjs/common';
import type { Dispatch, StaffRequest } from '@workarmy/types';
import type { DispatchInputData, StaffRequestInputData } from '@workarmy/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';

const txt = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

@Injectable()
export class StaffingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  async listRequests(userId: string): Promise<StaffRequest[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.staffRequest.findMany({
      where: { orgId },
      include: { recipients: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toStaffRequest);
  }

  async createRequest(userId: string, input: StaffRequestInputData): Promise<StaffRequest> {
    const { orgId } = await this.membership.requireOrg(userId);
    const recipients: { channel: 'SUPER_ADMIN' | 'CONTRACTOR'; recipientLabel: string }[] = [
      { channel: 'SUPER_ADMIN', recipientLabel: 'WorkArmy Super Admin' },
    ];
    for (const label of input.partnerLabels ?? []) {
      if (label.trim()) recipients.push({ channel: 'CONTRACTOR', recipientLabel: label.trim() });
    }
    const row = await this.prisma.staffRequest.create({
      data: {
        orgId,
        type: input.type ?? 'BULK_CREW',
        urgency: input.urgency ?? 'NORMAL',
        status: 'SENT',
        roleTitle: input.roleTitle,
        industry: txt(input.industry),
        description: txt(input.description),
        employmentType: txt(input.employmentType),
        site: txt(input.site),
        siteAddress: txt(input.siteAddress),
        suburb: txt(input.suburb),
        state: txt(input.state),
        startDate: txt(input.startDate),
        shiftType: txt(input.shiftType),
        startTime: txt(input.startTime),
        finishTime: txt(input.finishTime),
        headcountTotal: input.headcountTotal ?? 1,
        headcountMale: input.headcountMale ?? null,
        headcountFemale: input.headcountFemale ?? null,
        headcountAny: input.headcountAny ?? null,
        days: txt(input.days),
        skills: txt(input.skills),
        licences: txt(input.licences),
        experience: txt(input.experience),
        english: txt(input.english),
        ppe: txt(input.ppe),
        ppeSupplied: input.ppeSupplied ?? false,
        reportToName: txt(input.reportToName),
        reportToRole: txt(input.reportToRole),
        reportToMobile: txt(input.reportToMobile),
        reportToLocation: txt(input.reportToLocation),
        siteNotes: txt(input.siteNotes),
        payRate: txt(input.payRate),
        payBasis: txt(input.payBasis),
        award: txt(input.award),
        transport: input.transport ?? false,
        accommodation: input.accommodation ?? false,
        meals: input.meals ?? false,
        additionalNotes: txt(input.additionalNotes),
        sendToSuperAdmin: true,
        declarationAcceptedAt: new Date(),
        recipients: { create: recipients.map((r) => ({ channel: r.channel, recipientLabel: r.recipientLabel })) },
      },
      include: { recipients: true },
    });
    return toStaffRequest(row);
  }

  async listDispatches(userId: string): Promise<Dispatch[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.dispatch.findMany({
      where: { orgId },
      include: { targets: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toDispatch);
  }

  async createDispatch(userId: string, input: DispatchInputData): Promise<Dispatch> {
    const { orgId } = await this.membership.requireOrg(userId);
    const labels: Record<string, string> = {
      ON_CALL: 'On-call workers',
      CONTRACTORS: 'Engaged contractors',
      AGENCIES: 'Labour-hire agencies',
      NETWORK: 'WorkArmy network',
    };
    const row = await this.prisma.dispatch.create({
      data: {
        orgId,
        message: input.message,
        roleNeeded: txt(input.roleNeeded),
        headcount: input.headcount ?? null,
        whenAt: txt(input.whenAt),
        targets: { create: input.channels.map((channel) => ({ channel, targetLabel: labels[channel] ?? channel })) },
      },
      include: { targets: true },
    });
    return toDispatch(row);
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toStaffRequest(r: any): StaffRequest {
  return {
    id: r.id,
    type: r.type,
    urgency: r.urgency,
    status: r.status,
    roleTitle: r.roleTitle,
    industry: r.industry,
    description: r.description,
    employmentType: r.employmentType,
    site: r.site,
    siteAddress: r.siteAddress,
    suburb: r.suburb,
    state: r.state,
    startDate: r.startDate,
    shiftType: r.shiftType,
    startTime: r.startTime,
    finishTime: r.finishTime,
    headcountTotal: r.headcountTotal,
    headcountMale: r.headcountMale,
    headcountFemale: r.headcountFemale,
    headcountAny: r.headcountAny,
    days: r.days,
    skills: r.skills,
    licences: r.licences,
    experience: r.experience,
    english: r.english,
    ppe: r.ppe,
    ppeSupplied: r.ppeSupplied,
    reportToName: r.reportToName,
    reportToRole: r.reportToRole,
    reportToMobile: r.reportToMobile,
    reportToLocation: r.reportToLocation,
    siteNotes: r.siteNotes,
    payRate: r.payRate,
    payBasis: r.payBasis,
    award: r.award,
    transport: r.transport,
    accommodation: r.accommodation,
    meals: r.meals,
    additionalNotes: r.additionalNotes,
    sendToSuperAdmin: r.sendToSuperAdmin,
    createdAt: r.createdAt.toISOString(),
    recipients: (r.recipients ?? []).map((rc: any) => ({
      id: rc.id,
      channel: rc.channel,
      recipientLabel: rc.recipientLabel,
      status: rc.status,
    })),
  };
}

function toDispatch(d: any): Dispatch {
  return {
    id: d.id,
    message: d.message,
    roleNeeded: d.roleNeeded,
    headcount: d.headcount,
    whenAt: d.whenAt,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
    targets: (d.targets ?? []).map((t: any) => ({
      id: t.id,
      channel: t.channel,
      targetLabel: t.targetLabel,
      state: t.state,
    })),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
