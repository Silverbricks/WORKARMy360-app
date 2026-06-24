import { Injectable } from '@nestjs/common';
import type { Invoice, InvoiceLineItem, InvoiceLineKind, InvoiceStatus } from '@workarmy/types';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { ApiException } from '../../common/errors/api-exception';
import type { DbInvoice, DbInvoiceLineItem, InvoiceInputData } from './invoices.types';

type DbInvoiceWithItems = DbInvoice & { lineItems: DbInvoiceLineItem[] };

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
  ) {}

  async list(userId: string): Promise<Invoice[]> {
    const personId = await this.membership.requirePerson(userId);
    const rows = await this.prisma.invoice.findMany({
      where: { personId },
      include: { lineItems: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toInvoice);
  }

  async create(userId: string, input: InvoiceInputData): Promise<Invoice> {
    const personId = await this.membership.requirePerson(userId);

    // ABN gate — must hold a valid 11-digit ABN in Work Readiness.
    const wr = await this.prisma.workReadiness.findUnique({ where: { personId } });
    if (!wr?.abn || !/^\d{11}$/.test(wr.abn)) {
      throw ApiException.badRequest(
        'VALIDATION_ERROR',
        'A valid ABN is required to create invoices. Add it under Work Readiness.',
      );
    }

    const items = input.lineItems.map((li) => {
      const lineTotalCents = Math.round(li.qty) * Math.round(li.rateCents);
      return {
        kind: (li.kind === 'piece' ? 'PIECE' : 'HOURLY') as 'PIECE' | 'HOURLY',
        description: li.description,
        qty: Math.round(li.qty),
        rateCents: Math.round(li.rateCents),
        lineTotalCents,
      };
    });
    const subtotalCents = items.reduce((s, i) => s + i.lineTotalCents, 0);
    const gst = input.gst ?? false;
    const gstCents = gst ? Math.round(subtotalCents * 0.1) : 0;
    const totalCents = subtotalCents + gstCents;

    const baseData = {
      personId,
      clientName: input.clientName,
      clientAbn: input.clientAbn || null,
      date: input.date,
      gst,
      notes: input.notes || null,
      subtotalCents,
      gstCents,
      totalCents,
      lineItems: { create: items },
    };

    // Use the supplied number, or generate INV-{YYYY}-{seq} with a P2002-safe retry.
    const supplied = input.number?.trim();
    const year = new Date().getFullYear();
    const existing = await this.prisma.invoice.count({ where: { personId } });
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const number = supplied || `INV-${year}-${String(existing + 1 + attempt).padStart(4, '0')}`;
      try {
        const row = await this.prisma.invoice.create({
          data: { ...baseData, number },
          include: { lineItems: true },
        });
        return toInvoice(row);
      } catch (e) {
        if ((e as { code?: string }).code === 'P2002') {
          if (supplied) {
            throw ApiException.badRequest('VALIDATION_ERROR', 'An invoice with that number already exists.');
          }
          continue; // generated number collided — try the next sequence
        }
        throw e;
      }
    }
    throw ApiException.badRequest('VALIDATION_ERROR', 'Could not allocate an invoice number. Try again.');
  }

  async remove(userId: string, id: string): Promise<{ ok: true }> {
    const personId = await this.membership.requirePerson(userId);
    const existing = await this.prisma.invoice.findFirst({ where: { id, personId } });
    if (!existing) throw ApiException.notFound('Invoice not found.');
    await this.prisma.invoice.delete({ where: { id } });
    return { ok: true as const };
  }

  async markPaid(userId: string, id: string): Promise<Invoice> {
    const personId = await this.membership.requirePerson(userId);
    const existing = await this.prisma.invoice.findFirst({ where: { id, personId } });
    if (!existing) throw ApiException.notFound('Invoice not found.');
    await this.prisma.invoice.update({ where: { id }, data: { status: 'PAID' } });
    const row = await this.prisma.invoice.findUniqueOrThrow({
      where: { id },
      include: { lineItems: true },
    });
    return toInvoice(row);
  }
}

function toInvoice(r: DbInvoiceWithItems): Invoice {
  return {
    id: r.id,
    number: r.number,
    clientName: r.clientName,
    clientAbn: r.clientAbn,
    date: r.date,
    gst: r.gst,
    notes: r.notes,
    status: (r.status === 'PAID' ? 'Paid' : 'Sent') as InvoiceStatus,
    subtotalCents: r.subtotalCents,
    gstCents: r.gstCents,
    totalCents: r.totalCents,
    lineItems: r.lineItems.map(toLineItem),
    createdAt: r.createdAt.toISOString(),
  };
}

function toLineItem(r: DbInvoiceLineItem): InvoiceLineItem {
  return {
    id: r.id,
    kind: (r.kind === 'PIECE' ? 'piece' : 'hourly') as InvoiceLineKind,
    description: r.description,
    qty: r.qty,
    rateCents: r.rateCents,
    lineTotalCents: r.lineTotalCents,
  };
}
