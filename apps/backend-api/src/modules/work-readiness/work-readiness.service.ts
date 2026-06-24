import { Injectable } from '@nestjs/common';
import type {
  Engagement,
  TaxLodgement,
  TaxLodgementKind,
  TaxLodgementStatus,
  TaxShare,
  WorkReadiness,
} from '@workarmy/types';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import type {
  DbTaxLodgement,
  DbTaxShare,
  DbWorkReadiness,
  TaxLodgementInputData,
  TaxShareInputData,
  WorkReadinessUpdateData,
} from './work-readiness.types';

function isValidAbn(v: string | null): boolean {
  return !!v && /^\d{11}$/.test(v);
}
function isValidTfn(v: string | null): boolean {
  return !!v && /^\d{8,9}$/.test(v);
}

/** Gate 3: id (per engagement) + super fund + bank + no-cash ack. */
function computeWorkReady(r: DbWorkReadiness): boolean {
  const idOk =
    r.engagement === 'CONTRACT'
      ? isValidAbn(r.abn)
      : r.engagement === 'EMPLOYEE'
        ? isValidTfn(r.tfn)
        : false;
  const superOk = !!r.superFund;
  const bankOk = !!(r.bankBsb && r.bankAccount);
  return idOk && superOk && bankOk && r.noCashAck === true;
}

@Injectable()
export class WorkReadinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  async get(userId: string): Promise<WorkReadiness> {
    const personId = await this.membership.requirePerson(userId);
    return this.loadDto(personId);
  }

  async update(userId: string, input: WorkReadinessUpdateData): Promise<WorkReadiness> {
    const personId = await this.membership.requirePerson(userId);
    const data = buildData(input);
    const row = await this.prisma.workReadiness.upsert({
      where: { personId },
      update: data,
      create: { personId, ...data },
    });
    const ready = computeWorkReady(row);
    if (ready !== row.workReady) {
      await this.prisma.workReadiness.update({ where: { personId }, data: { workReady: ready } });
    }
    return this.loadDto(personId);
  }

  async listLodgements(userId: string): Promise<TaxLodgement[]> {
    const personId = await this.membership.requirePerson(userId);
    const rows = await this.prisma.taxLodgement.findMany({
      where: { personId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toLodgement);
  }

  async addLodgement(userId: string, input: TaxLodgementInputData): Promise<TaxLodgement> {
    const personId = await this.membership.requirePerson(userId);
    await this.ensureRow(personId);
    const row = await this.prisma.taxLodgement.create({
      data: {
        personId,
        kind: input.kind === 'abn' ? 'ABN' : 'PERSONAL',
        financialYear: input.financialYear,
        note: input.note || null,
      },
    });
    return toLodgement(row);
  }

  async listShares(userId: string): Promise<TaxShare[]> {
    const personId = await this.membership.requirePerson(userId);
    const rows = await this.prisma.taxShare.findMany({
      where: { personId },
      orderBy: { sharedAt: 'desc' },
    });
    return rows.map(toShare);
  }

  async addShare(userId: string, input: TaxShareInputData): Promise<TaxShare> {
    const personId = await this.membership.requirePerson(userId);
    await this.ensureRow(personId);
    const row = await this.prisma.taxShare.create({
      data: {
        personId,
        employer: input.employer,
        passwordProtected: input.passwordProtected ?? false,
      },
    });
    return toShare(row);
  }

  /** Gate-3 check consumed by applications + shifts. */
  async isWorkReady(personId: string): Promise<boolean> {
    const row = await this.prisma.workReadiness.findUnique({ where: { personId } });
    return row ? computeWorkReady(row) : false;
  }

  private async ensureRow(personId: string): Promise<void> {
    await this.prisma.workReadiness.upsert({
      where: { personId },
      update: {},
      create: { personId },
    });
  }

  private async loadDto(personId: string): Promise<WorkReadiness> {
    const row = await this.prisma.workReadiness.findUnique({
      where: { personId },
      include: {
        lodgements: { orderBy: { createdAt: 'desc' } },
        shares: { orderBy: { sharedAt: 'desc' } },
      },
    });
    if (!row) return emptyReadiness();
    return {
      engagement: row.engagement ? (row.engagement.toLowerCase() as Engagement) : null,
      tfn: row.tfn,
      abn: row.abn,
      hasSuper: row.hasSuper,
      superFund: row.superFund,
      superMember: row.superMember,
      bankBsb: row.bankBsb,
      bankAccount: row.bankAccount,
      noCashAck: row.noCashAck,
      bankLater: row.bankLater,
      workReady: row.workReady,
      lodgements: row.lodgements.map(toLodgement),
      shares: row.shares.map(toShare),
    };
  }
}

function buildData(input: WorkReadinessUpdateData) {
  const data: Record<string, unknown> = {};
  if (input.engagement !== undefined) data.engagement = input.engagement === 'contract' ? 'CONTRACT' : 'EMPLOYEE';
  if (input.tfn !== undefined) data.tfn = input.tfn || null;
  if (input.abn !== undefined) data.abn = input.abn || null;
  if (input.hasSuper !== undefined) data.hasSuper = input.hasSuper;
  if (input.superFund !== undefined) data.superFund = input.superFund || null;
  if (input.superMember !== undefined) data.superMember = input.superMember || null;
  if (input.bankBsb !== undefined) data.bankBsb = input.bankBsb || null;
  if (input.bankAccount !== undefined) data.bankAccount = input.bankAccount || null;
  if (input.noCashAck !== undefined) data.noCashAck = input.noCashAck;
  if (input.bankLater !== undefined) data.bankLater = input.bankLater;
  return data;
}

function emptyReadiness(): WorkReadiness {
  return {
    engagement: null,
    tfn: null,
    abn: null,
    hasSuper: false,
    superFund: null,
    superMember: null,
    bankBsb: null,
    bankAccount: null,
    noCashAck: false,
    bankLater: false,
    workReady: false,
    lodgements: [],
    shares: [],
  };
}

function toLodgement(r: DbTaxLodgement): TaxLodgement {
  return {
    id: r.id,
    kind: r.kind.toLowerCase() as TaxLodgementKind,
    financialYear: r.financialYear,
    note: r.note,
    status: r.status.toLowerCase() as TaxLodgementStatus,
    createdAt: r.createdAt.toISOString(),
  };
}

function toShare(r: DbTaxShare): TaxShare {
  return {
    id: r.id,
    employer: r.employer,
    passwordProtected: r.passwordProtected,
    sharedAt: r.sharedAt.toISOString(),
  };
}
