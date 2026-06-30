import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '../platform/config.service';

/**
 * Roster / Workforce Platform Builder routes (under the global /api/v1 prefix).
 * Phase 1 ships the Module Marketplace catalog + template list; the DB-backed
 * config, requirements, grid, etc. land in later phases on this controller.
 */
@Controller()
export class PlannerController {
  constructor(private readonly config: ConfigService) {}

  @Get('planner/config/catalog')
  catalog() {
    return this.config.catalog();
  }

  @Get('planner/config/templates')
  templates() {
    return this.config.templates();
  }
}
