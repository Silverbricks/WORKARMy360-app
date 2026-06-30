import { Injectable } from '@nestjs/common';
import type { IndustryTemplateSummary, ModuleCatalogEntry } from '@workarmy/types';
import { MODULE_CATALOG } from './module-catalog';
import { INDUSTRY_TEMPLATES } from './industry-templates';

/**
 * The Company Builder config service (Roster Builder in v1). Phase 1 exposes the
 * pure-data Module Marketplace catalog + industry-template summaries; Phase 2
 * adds the DB-backed resolve / applyTemplate / patch* methods over the
 * Platform* config tables (all audited + event-emitting).
 */
@Injectable()
export class ConfigService {
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
}
