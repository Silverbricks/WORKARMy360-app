import { Injectable } from '@nestjs/common';
import type {
  ConfigCategory,
  ConfigField,
  ConfigGate,
  ConfigModule,
  IndustryTemplateSummary,
  ModuleCatalogEntry,
  ResolvedConfig,
} from '@workarmy/types';
import type {
  ConfigCategoryData,
  ConfigFieldData,
  ConfigGateData,
  ConfigGeneralData,
  ConfigTermData,
  ModuleToggleData,
} from '@workarmy/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { MembershipService } from '../../common/membership/membership.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../../common/errors/api-exception';
import { catalogEntry, MODULE_CATALOG, withDependencies } from './module-catalog';
import { DEFAULT_TEMPLATE_KEY, industryTemplate, INDUSTRY_TEMPLATES } from './industry-templates';

const ORG_SCOPE = { scope: 'ORG' as const, scopeRefId: null };

/**
 * Company Builder config service (Roster Builder in v1). The metadata substrate
 * every Builder writes; the runtime reads the *resolved* config and renders
 * generically. NO industry branches — industries are data (INDUSTRY_TEMPLATES).
 * Every write is audited. v1 operates at ORG scope only; the parentId/scope
 * columns are the seam the Studio uses for org→client→site→dept→team inheritance.
 */
@Injectable()
export class ConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipService,
    private readonly audit: AuditService,
  ) {}

  /** The Feature Marketplace catalog (modules a company can switch on/off). */
  catalog(): ModuleCatalogEntry[] {
    return MODULE_CATALOG;
  }

  /** Industry-template summaries for the "apply template" picker. */
  templates(): IndustryTemplateSummary[] {
    return INDUSTRY_TEMPLATES.map((t) => ({
      key: t.key,
      label: t.label,
      emoji: t.emoji,
      moduleCount: t.modules.length,
    }));
  }

  // ---- resolve -------------------------------------------------------------

  async resolveForUser(userId: string): Promise<ResolvedConfig> {
    const { orgId } = await this.membership.requireOrg(userId);
    return this.resolve(orgId);
  }

  /** Effective config for an org. Falls back to the matching industry template
   *  (or `general`) for any builder that has no stored rows yet. */
  async resolve(orgId: string): Promise<ResolvedConfig> {
    const where = { orgId, ...ORG_SCOPE };
    const [config, modules, terms, categories, gates, fields] = await this.prisma.$transaction([
      this.prisma.platformConfig.findFirst({ where }),
      this.prisma.platformModule.findMany({ where, orderBy: { key: 'asc' } }),
      this.prisma.platformTerm.findMany({ where }),
      this.prisma.platformCategory.findMany({ where, orderBy: { order: 'asc' } }),
      this.prisma.platformGate.findMany({ where, orderBy: { key: 'asc' } }),
      this.prisma.platformField.findMany({ where, orderBy: { order: 'asc' } }),
    ]);

    const tpl = industryTemplate(config?.templateKey ?? DEFAULT_TEMPLATE_KEY) ?? industryTemplate(DEFAULT_TEMPLATE_KEY)!;

    const terminology: Record<string, string> = { ...tpl.terminology };
    for (const t of terms) terminology[t.term] = t.label;

    const moduleList: ConfigModule[] = modules.length
      ? modules.map((m) => ({ key: m.key, enabled: m.enabled, license: m.license }))
      : withDependencies(tpl.modules).map((key) => ({ key, enabled: true, license: 'ENABLED' as const }));

    const categoryList: ConfigCategory[] = categories.length
      ? categories.map((c) => ({ key: c.key, label: c.label, color: c.color, kind: c.kind }))
      : tpl.categories.map((c) => ({ key: c.key, label: c.label, color: c.color, kind: 'SHIFT' }));

    const gateList: ConfigGate[] = gates.length
      ? gates.map((g) => ({ key: g.key, label: g.label, credentialType: g.credentialType, block: g.block }))
      : tpl.gates.map((g) => ({ key: g.key, label: g.label, credentialType: g.credentialType, block: g.block }));

    const fieldList: ConfigField[] = fields.map((f) => ({
      key: f.key,
      label: f.label,
      type: f.type,
      options: (f.options as string[] | null) ?? null,
      target: f.target,
      required: f.required,
      order: f.order,
    }));

    return {
      scope: 'ORG',
      templateKey: config?.templateKey ?? null,
      planningMode: config?.planningMode ?? tpl.planningMode,
      weekStartsMonday: config?.weekStartsMonday ?? true,
      terminology,
      modules: moduleList,
      categories: categoryList,
      gates: gateList,
      fields: fieldList,
    };
  }

  // ---- apply template ------------------------------------------------------

  async applyTemplate(userId: string, templateKey: string): Promise<ResolvedConfig> {
    const { orgId } = await this.membership.requireOrg(userId);
    const tpl = industryTemplate(templateKey);
    if (!tpl) throw ApiException.badRequest('VALIDATION_ERROR', `Unknown template: ${templateKey}`);
    const base = { orgId, ...ORG_SCOPE };
    const moduleKeys = withDependencies(tpl.modules);

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.platformConfig.findFirst({ where: base });
      if (existing) {
        await tx.platformConfig.update({
          where: { id: existing.id },
          data: { templateKey, planningMode: tpl.planningMode },
        });
      } else {
        await tx.platformConfig.create({
          data: { ...base, templateKey, planningMode: tpl.planningMode, weekStartsMonday: true },
        });
      }

      await tx.platformModule.deleteMany({ where: base });
      await tx.platformModule.createMany({ data: moduleKeys.map((key) => ({ ...base, key, enabled: true })) });

      await tx.platformTerm.deleteMany({ where: base });
      await tx.platformTerm.createMany({
        data: Object.entries(tpl.terminology).map(([term, label]) => ({ ...base, term, label })),
      });

      await tx.platformCategory.deleteMany({ where: base });
      await tx.platformCategory.createMany({
        data: tpl.categories.map((c, i) => ({ ...base, key: c.key, label: c.label, color: c.color, kind: 'SHIFT', order: i })),
      });

      await tx.platformGate.deleteMany({ where: base });
      if (tpl.gates.length) {
        await tx.platformGate.createMany({
          data: tpl.gates.map((g) => ({ ...base, key: g.key, label: g.label, credentialType: g.credentialType, block: g.block })),
        });
      }

      // Re-seed template shift templates; keep user-created ones (templateKey null).
      await tx.rosterTemplate.deleteMany({ where: { orgId, templateKey: { not: null } } });
      await tx.rosterTemplate.createMany({
        data: tpl.shiftTemplates.map((s) => ({
          orgId,
          name: s.name,
          category: s.category,
          startTime: s.startTime,
          endTime: s.endTime,
          templateKey,
        })),
      });
    });

    await this.audit.record('CONFIG_UPDATED', { userId, metadata: { action: 'apply-template', orgId, templateKey } });
    return this.resolve(orgId);
  }

  // ---- per-builder patches -------------------------------------------------

  async patchGeneral(userId: string, data: ConfigGeneralData): Promise<ResolvedConfig> {
    const { orgId } = await this.membership.requireOrg(userId);
    const base = { orgId, ...ORG_SCOPE };
    const existing = await this.prisma.platformConfig.findFirst({ where: base });
    if (existing) {
      await this.prisma.platformConfig.update({
        where: { id: existing.id },
        data: {
          planningMode: data.planningMode ?? undefined,
          weekStartsMonday: data.weekStartsMonday ?? undefined,
          name: data.name ?? undefined,
        },
      });
    } else {
      await this.prisma.platformConfig.create({
        data: {
          ...base,
          templateKey: DEFAULT_TEMPLATE_KEY,
          planningMode: data.planningMode ?? 'demand',
          weekStartsMonday: data.weekStartsMonday ?? true,
          name: data.name ?? null,
        },
      });
    }
    return this.recordAndResolve(userId, orgId, 'general');
  }

  async toggleModule(userId: string, body: ModuleToggleData): Promise<ResolvedConfig> {
    const { orgId } = await this.membership.requireOrg(userId);
    if (!catalogEntry(body.key)) throw ApiException.badRequest('VALIDATION_ERROR', `Unknown module: ${body.key}`);
    await this.materialize(orgId);
    const base = { orgId, ...ORG_SCOPE };
    const enabled = body.enabled ?? true;
    // Enabling pulls in dependencies (e.g. Payroll → Timesheets).
    const keys = enabled ? withDependencies([body.key]) : [body.key];
    for (const key of keys) {
      const existing = await this.prisma.platformModule.findFirst({ where: { ...base, key } });
      if (existing) {
        await this.prisma.platformModule.update({
          where: { id: existing.id },
          data: { enabled, license: body.license ?? undefined },
        });
      } else {
        await this.prisma.platformModule.create({
          data: { ...base, key, enabled, license: body.license ?? 'ENABLED' },
        });
      }
    }
    return this.recordAndResolve(userId, orgId, 'module', { key: body.key, enabled });
  }

  async setTerm(userId: string, body: ConfigTermData): Promise<ResolvedConfig> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.materialize(orgId);
    const base = { orgId, ...ORG_SCOPE };
    const existing = await this.prisma.platformTerm.findFirst({ where: { ...base, term: body.term } });
    if (existing) await this.prisma.platformTerm.update({ where: { id: existing.id }, data: { label: body.label } });
    else await this.prisma.platformTerm.create({ data: { ...base, term: body.term, label: body.label } });
    return this.recordAndResolve(userId, orgId, 'term', { term: body.term });
  }

  async setCategory(userId: string, body: ConfigCategoryData): Promise<ResolvedConfig> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.materialize(orgId);
    const base = { orgId, ...ORG_SCOPE };
    const existing = await this.prisma.platformCategory.findFirst({ where: { ...base, key: body.key } });
    const data = { label: body.label, color: body.color, kind: body.kind ?? 'SHIFT' };
    if (existing) await this.prisma.platformCategory.update({ where: { id: existing.id }, data });
    else await this.prisma.platformCategory.create({ data: { ...base, key: body.key, ...data, order: 0 } });
    return this.recordAndResolve(userId, orgId, 'category', { key: body.key });
  }

  async removeCategory(userId: string, key: string): Promise<ResolvedConfig> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.materialize(orgId);
    await this.prisma.platformCategory.deleteMany({ where: { orgId, ...ORG_SCOPE, key } });
    return this.recordAndResolve(userId, orgId, 'category-remove', { key });
  }

  async setGate(userId: string, body: ConfigGateData): Promise<ResolvedConfig> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.materialize(orgId);
    const base = { orgId, ...ORG_SCOPE };
    const existing = await this.prisma.platformGate.findFirst({ where: { ...base, key: body.key } });
    const data = { label: body.label, credentialType: body.credentialType, block: body.block ?? false };
    if (existing) await this.prisma.platformGate.update({ where: { id: existing.id }, data });
    else await this.prisma.platformGate.create({ data: { ...base, key: body.key, ...data } });
    return this.recordAndResolve(userId, orgId, 'gate', { key: body.key });
  }

  async removeGate(userId: string, key: string): Promise<ResolvedConfig> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.materialize(orgId);
    await this.prisma.platformGate.deleteMany({ where: { orgId, ...ORG_SCOPE, key } });
    return this.recordAndResolve(userId, orgId, 'gate-remove', { key });
  }

  async setField(userId: string, body: ConfigFieldData): Promise<ResolvedConfig> {
    const { orgId } = await this.membership.requireOrg(userId);
    const base = { orgId, ...ORG_SCOPE };
    const existing = await this.prisma.platformField.findFirst({ where: { ...base, key: body.key } });
    const data = {
      label: body.label,
      type: body.type ?? 'text',
      options: body.options ?? undefined,
      target: body.target ?? 'requirement',
      required: body.required ?? false,
      order: body.order ?? 0,
    };
    if (existing) await this.prisma.platformField.update({ where: { id: existing.id }, data });
    else await this.prisma.platformField.create({ data: { ...base, key: body.key, ...data } });
    return this.recordAndResolve(userId, orgId, 'field', { key: body.key });
  }

  async removeField(userId: string, key: string): Promise<ResolvedConfig> {
    const { orgId } = await this.membership.requireOrg(userId);
    await this.prisma.platformField.deleteMany({ where: { orgId, ...ORG_SCOPE, key } });
    return this.recordAndResolve(userId, orgId, 'field-remove', { key });
  }

  // ---- helpers -------------------------------------------------------------

  private async recordAndResolve(
    userId: string,
    orgId: string,
    action: string,
    extra: Record<string, unknown> = {},
  ): Promise<ResolvedConfig> {
    await this.audit.record('CONFIG_UPDATED', { userId, metadata: { action, orgId, ...extra } });
    return this.resolve(orgId);
  }

  /**
   * Materialize the resolved (template-default) config into real rows the first
   * time a builder is edited, so editing one item doesn't drop the rest of the
   * template's defaults.
   */
  private async materialize(orgId: string): Promise<void> {
    const base = { orgId, ...ORG_SCOPE };
    const [configRow, mCount, cCount, tCount] = await this.prisma.$transaction([
      this.prisma.platformConfig.findFirst({ where: base }),
      this.prisma.platformModule.count({ where: base }),
      this.prisma.platformCategory.count({ where: base }),
      this.prisma.platformTerm.count({ where: base }),
    ]);
    if (configRow && mCount && cCount && tCount) return;
    const r = await this.resolve(orgId);
    await this.prisma.$transaction(async (tx) => {
      if (!configRow) {
        await tx.platformConfig.create({
          data: {
            ...base,
            templateKey: r.templateKey ?? DEFAULT_TEMPLATE_KEY,
            planningMode: r.planningMode,
            weekStartsMonday: r.weekStartsMonday,
          },
        });
      }
      if (!mCount) {
        await tx.platformModule.createMany({
          data: r.modules.map((m) => ({ ...base, key: m.key, enabled: m.enabled, license: m.license })),
        });
      }
      if (!cCount) {
        await tx.platformCategory.createMany({
          data: r.categories.map((c, i) => ({ ...base, key: c.key, label: c.label, color: c.color, kind: c.kind, order: i })),
        });
      }
      if (!tCount) {
        await tx.platformTerm.createMany({
          data: Object.entries(r.terminology).map(([term, label]) => ({ ...base, term, label })),
        });
      }
      const gCount = await tx.platformGate.count({ where: base });
      if (!gCount && r.gates.length) {
        await tx.platformGate.createMany({
          data: r.gates.map((g) => ({ ...base, key: g.key, label: g.label, credentialType: g.credentialType, block: g.block })),
        });
      }
    });
  }
}
