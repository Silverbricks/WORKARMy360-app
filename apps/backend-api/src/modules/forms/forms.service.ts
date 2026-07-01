import { Injectable } from '@nestjs/common';
import type { Prisma } from '@workarmy/database';
import type { FormDefinition, FormFieldDef, FormSubmissionView, OkResponse } from '@workarmy/types';
import type { FormInputData, FormSubmissionInputData } from '@workarmy/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../../common/errors/api-exception';

type FormRow = Prisma.PlatformFormGetPayload<{ include: { _count: { select: { submissions: true } } } }>;
const FORM_INCLUDE = { _count: { select: { submissions: true } } } as const;

function toDef(row: FormRow): FormDefinition {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    fields: (row.fields as unknown as FormFieldDef[]) ?? [],
    status: row.status,
    version: row.version,
    submissionCount: row._count.submissions,
  };
}

const nameOf = (p: { firstName: string | null; lastName: string | null; waId: string }) =>
  `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.waId;

@Injectable()
export class FormsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
    private readonly audit: AuditService,
  ) {}

  async list(userId: string): Promise<FormDefinition[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    const rows = await this.prisma.platformForm.findMany({ where: { orgId }, include: FORM_INCLUDE, orderBy: { updatedAt: 'desc' } });
    return rows.map(toDef);
  }

  async create(userId: string, input: FormInputData): Promise<FormDefinition> {
    const { orgId } = await this.membership.requireOrg(userId);
    const row = await this.prisma.platformForm.create({
      data: {
        orgId,
        name: input.name,
        description: input.description ?? null,
        category: input.category ?? 'general',
        fields: input.fields as unknown as Prisma.InputJsonValue,
        status: 'DRAFT',
      },
      include: FORM_INCLUDE,
    });
    await this.audit.record('CONFIG_UPDATED', { userId, metadata: { action: 'form-create', orgId, formId: row.id } });
    return toDef(row);
  }

  async update(userId: string, id: string, input: FormInputData): Promise<FormDefinition> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.requireForm(orgId, id);
    const row = await this.prisma.platformForm.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description ?? null,
        category: input.category ?? undefined,
        fields: input.fields as unknown as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
      include: FORM_INCLUDE,
    });
    await this.audit.record('CONFIG_UPDATED', { userId, metadata: { action: 'form-update', orgId, formId: id } });
    return toDef(row);
  }

  async publish(userId: string, id: string): Promise<FormDefinition> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.requireForm(orgId, id);
    const row = await this.prisma.platformForm.update({ where: { id }, data: { status: 'PUBLISHED' }, include: FORM_INCLUDE });
    await this.audit.record('CONFIG_UPDATED', { userId, metadata: { action: 'form-publish', orgId, formId: id } });
    return toDef(row);
  }

  async remove(userId: string, id: string): Promise<OkResponse> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.requireForm(orgId, id);
    await this.prisma.platformForm.delete({ where: { id } });
    return { ok: true };
  }

  async listSubmissions(userId: string, formId: string): Promise<FormSubmissionView[]> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.requireForm(orgId, formId);
    const rows = await this.prisma.formSubmission.findMany({ where: { orgId, formId }, orderBy: { createdAt: 'desc' }, take: 200 });
    return rows.map((s) => ({
      id: s.id,
      formId: s.formId,
      submitterName: s.submitterName,
      contextLabel: s.contextLabel,
      data: (s.data as Record<string, unknown>) ?? {},
      createdAt: s.createdAt.toISOString(),
    }));
  }

  async submit(userId: string, formId: string, input: FormSubmissionInputData): Promise<FormSubmissionView> {
    const { orgId, personId } = await this.membership.requireOrg(userId);
    await this.requireForm(orgId, formId);
    const person = await this.prisma.person.findUnique({ where: { id: personId }, select: { firstName: true, lastName: true, waId: true } });
    const name = person ? nameOf(person) : null;
    const s = await this.prisma.formSubmission.create({
      data: {
        orgId,
        formId,
        submittedByPersonId: personId,
        submitterName: name,
        contextLabel: input.contextLabel ?? null,
        data: input.data as Prisma.InputJsonValue,
      },
    });
    return { id: s.id, formId, submitterName: name, contextLabel: s.contextLabel, data: input.data, createdAt: s.createdAt.toISOString() };
  }

  private async requireForm(orgId: string, id: string) {
    const form = await this.prisma.platformForm.findFirst({ where: { id, orgId }, select: { id: true } });
    if (!form) throw ApiException.notFound('Form not found.');
    return form;
  }
}
