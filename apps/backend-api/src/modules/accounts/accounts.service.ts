import { Injectable } from '@nestjs/common';
import { Prisma } from '@workarmy/database';
import type { BusinessDoc, PayRun, PieceRate } from '@workarmy/types';
import type {
  BusinessDocInputData,
  PayRunInputData,
  PieceRateInputData,
} from '@workarmy/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { ApiException } from '../../common/errors/api-exception';

const cents = (dollars: number) => Math.round(dollars * 100);
const PREFIX: Record<string, string> = { INVOICE: 'INV', QUOTE: 'QTE', PROPOSAL: 'PRO' };

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  // ---- Pay runs ----
  async listPayRuns(userId: string): Promise<PayRun[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.payRun.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    return rows.map(toPayRun);
  }

  async buildPayRun(userId: string, input: PayRunInputData): Promise<PayRun> {
    const { orgId } = await this.membership.requireOrg(userId);
    const slips = await this.prisma.payslip.findMany({ where: { orgId }, select: { personId: true, grossPay: true, tax: true, superannuation: true, netPay: true } });
    const grossPay = slips.reduce((n, s) => n + (s.grossPay ?? 0), 0);
    const payg = slips.reduce((n, s) => n + (s.tax ?? 0), 0);
    const superAmount = slips.reduce((n, s) => n + (s.superannuation ?? 0), 0);
    const netPay = slips.reduce((n, s) => n + (s.netPay ?? 0), 0);
    const workers = new Set(slips.map((s) => s.personId)).size;
    const row = await this.prisma.payRun.create({
      data: { orgId, periodStart: input.periodStart, periodEnd: input.periodEnd, grossPay, payg, superAmount, netPay, workers },
    });
    return toPayRun(row);
  }

  async setPayRunStatus(userId: string, id: string, status: PayRun['status']): Promise<PayRun> {
    const { orgId } = await this.membership.requireOrg(userId);
    const existing = await this.prisma.payRun.findFirst({ where: { id, orgId }, select: { id: true } });
    if (!existing) throw ApiException.notFound('Pay run not found.');
    const row = await this.prisma.payRun.update({
      where: { id },
      data: {
        status,
        abaGenerated: status !== 'DRAFT' ? true : undefined,
        stpLodged: status === 'PAID' ? true : undefined,
      },
    });
    return toPayRun(row);
  }

  // ---- Business docs ----
  async listDocs(userId: string): Promise<BusinessDoc[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.businessDoc.findMany({
      where: { orgId },
      include: { lines: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toDoc);
  }

  async createDoc(userId: string, input: BusinessDocInputData): Promise<BusinessDoc> {
    const { orgId } = await this.membership.requireOrg(userId);
    const type = input.type ?? 'INVOICE';
    const lines = input.lines.map((l) => {
      const rateCents = cents(l.rate);
      return { description: l.description, qty: l.qty, rateCents, lineTotalCents: rateCents * l.qty };
    });
    const subtotalCents = lines.reduce((n, l) => n + l.lineTotalCents, 0);
    const gst = input.gst ?? true;
    const gstCents = gst ? Math.round(subtotalCents * 0.1) : 0;
    const totalCents = subtotalCents + gstCents;

    for (let attempt = 0; attempt < 4; attempt++) {
      const number = input.number?.trim() || (await this.nextNumber(orgId, type, attempt));
      try {
        const row = await this.prisma.businessDoc.create({
          data: {
            orgId,
            type,
            number,
            clientName: input.clientName,
            clientAbn: input.clientAbn?.trim() || null,
            date: input.date?.trim() || new Date().toISOString().slice(0, 10),
            gst,
            notes: input.notes?.trim() || null,
            status: type === 'INVOICE' ? 'SENT' : 'DRAFT',
            subtotalCents,
            gstCents,
            totalCents,
            lines: { create: lines },
          },
          include: { lines: true },
        });
        return toDoc(row);
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002' && !input.number) continue;
        throw e;
      }
    }
    throw ApiException.badRequest('VALIDATION_ERROR', 'Could not allocate a document number. Try again.');
  }

  private async nextNumber(orgId: string, type: string, bump: number): Promise<string> {
    const count = await this.prisma.businessDoc.count({ where: { orgId, type: type as BusinessDoc['type'] } });
    return `${PREFIX[type]}-${new Date().getFullYear()}-${1000 + count + 1 + bump}`;
  }

  async setDocStatus(userId: string, id: string, status: BusinessDoc['status']): Promise<BusinessDoc> {
    const { orgId } = await this.membership.requireOrg(userId);
    const existing = await this.prisma.businessDoc.findFirst({ where: { id, orgId }, select: { id: true } });
    if (!existing) throw ApiException.notFound('Document not found.');
    const row = await this.prisma.businessDoc.update({ where: { id }, data: { status }, include: { lines: true } });
    return toDoc(row);
  }

  async removeDoc(userId: string, id: string): Promise<{ ok: true }> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.prisma.businessDoc.deleteMany({ where: { id, orgId } });
    return { ok: true as const };
  }

  // ---- Piece rates ----
  async listPieceRates(userId: string): Promise<PieceRate[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.pieceRate.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
    return rows.map((p) => ({ id: p.id, name: p.name, unitLabel: p.unitLabel, rateCents: p.rateCents, minWageCents: p.minWageCents, active: p.active }));
  }
  async createPieceRate(userId: string, input: PieceRateInputData): Promise<PieceRate> {
    const { orgId } = await this.membership.requireOrg(userId);
    const p = await this.prisma.pieceRate.create({
      data: { orgId, name: input.name, unitLabel: input.unitLabel, rateCents: cents(input.rate), minWageCents: input.minWage !== undefined ? cents(input.minWage) : null },
    });
    return { id: p.id, name: p.name, unitLabel: p.unitLabel, rateCents: p.rateCents, minWageCents: p.minWageCents, active: p.active };
  }
  async removePieceRate(userId: string, id: string): Promise<{ ok: true }> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.prisma.pieceRate.deleteMany({ where: { id, orgId } });
    return { ok: true as const };
  }
}

function toPayRun(r: { id: string; periodStart: string; periodEnd: string; status: PayRun['status']; grossPay: number; payg: number; superAmount: number; netPay: number; workers: number; abaGenerated: boolean; stpLodged: boolean; createdAt: Date }): PayRun {
  return { id: r.id, periodStart: r.periodStart, periodEnd: r.periodEnd, status: r.status, grossPay: r.grossPay, payg: r.payg, superAmount: r.superAmount, netPay: r.netPay, workers: r.workers, abaGenerated: r.abaGenerated, stpLodged: r.stpLodged, createdAt: r.createdAt.toISOString() };
}

type DbDoc = {
  id: string; type: BusinessDoc['type']; number: string; clientName: string; clientAbn: string | null; date: string;
  gst: boolean; notes: string | null; status: BusinessDoc['status']; subtotalCents: number; gstCents: number; totalCents: number; createdAt: Date;
  lines: { id: string; description: string; qty: number; rateCents: number; lineTotalCents: number }[];
};
function toDoc(d: DbDoc): BusinessDoc {
  return {
    id: d.id, type: d.type, number: d.number, clientName: d.clientName, clientAbn: d.clientAbn, date: d.date,
    gst: d.gst, notes: d.notes, status: d.status, subtotalCents: d.subtotalCents, gstCents: d.gstCents, totalCents: d.totalCents,
    createdAt: d.createdAt.toISOString(),
    lines: d.lines.map((l) => ({ id: l.id, description: l.description, qty: l.qty, rateCents: l.rateCents, lineTotalCents: l.lineTotalCents })),
  };
}
