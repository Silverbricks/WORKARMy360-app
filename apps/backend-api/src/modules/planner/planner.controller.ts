import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApplyTemplateSchema,
  ConfigCategorySchema,
  ConfigFieldSchema,
  ConfigGateSchema,
  ConfigGeneralSchema,
  ConfigTermSchema,
  ModuleToggleSchema,
  PlannerAssignSchema,
  PlannerRespondSchema,
  StaffingRequirementInputSchema,
  StaffingRequirementUpdateSchema,
  type ApplyTemplateData,
  type ConfigCategoryData,
  type ConfigFieldData,
  type ConfigGateData,
  type ConfigGeneralData,
  type ConfigTermData,
  type ModuleToggleData,
  type PlannerAssignData,
  type PlannerRespondData,
  type StaffingRequirementInputData,
  type StaffingRequirementUpdateData,
} from '@workarmy/validation';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ConfigService } from '../platform/config.service';
import { PlannerService } from './planner.service';

@Controller()
export class PlannerController {
  constructor(
    private readonly config: ConfigService,
    private readonly planner: PlannerService,
  ) {}

  // ---- Company Builder config (Roster Builder) ----
  @Get('planner/config')
  resolveConfig(@CurrentUser() user: { sub: string }) {
    return this.config.resolveForUser(user.sub);
  }

  @Get('planner/config/catalog')
  catalog() {
    return this.config.catalog();
  }

  @Get('planner/config/templates')
  templates() {
    return this.config.templates();
  }

  @Post('planner/config/apply-template')
  applyTemplate(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(ApplyTemplateSchema)) body: ApplyTemplateData,
  ) {
    return this.config.applyTemplate(user.sub, body.templateKey);
  }

  @Patch('planner/config/general')
  patchGeneral(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(ConfigGeneralSchema)) body: ConfigGeneralData,
  ) {
    return this.config.patchGeneral(user.sub, body);
  }

  @Patch('planner/config/module')
  toggleModule(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(ModuleToggleSchema)) body: ModuleToggleData,
  ) {
    return this.config.toggleModule(user.sub, body);
  }

  @Patch('planner/config/term')
  setTerm(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(ConfigTermSchema)) body: ConfigTermData,
  ) {
    return this.config.setTerm(user.sub, body);
  }

  @Patch('planner/config/category')
  setCategory(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(ConfigCategorySchema)) body: ConfigCategoryData,
  ) {
    return this.config.setCategory(user.sub, body);
  }

  @Delete('planner/config/category/:key')
  removeCategory(@CurrentUser() user: { sub: string }, @Param('key') key: string) {
    return this.config.removeCategory(user.sub, key);
  }

  @Patch('planner/config/gate')
  setGate(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(ConfigGateSchema)) body: ConfigGateData,
  ) {
    return this.config.setGate(user.sub, body);
  }

  @Delete('planner/config/gate/:key')
  removeGate(@CurrentUser() user: { sub: string }, @Param('key') key: string) {
    return this.config.removeGate(user.sub, key);
  }

  @Patch('planner/config/field')
  setField(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(ConfigFieldSchema)) body: ConfigFieldData,
  ) {
    return this.config.setField(user.sub, body);
  }

  @Delete('planner/config/field/:key')
  removeField(@CurrentUser() user: { sub: string }, @Param('key') key: string) {
    return this.config.removeField(user.sub, key);
  }

  // ---- Requirements (demand) ----
  @Get('planner/requirements')
  listRequirements(
    @CurrentUser() user: { sub: string },
    @Query() query: { from?: string; to?: string },
  ) {
    return this.planner.list(user.sub, { from: query.from, to: query.to });
  }

  @Post('planner/requirements')
  createRequirement(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(StaffingRequirementInputSchema)) body: StaffingRequirementInputData,
  ) {
    return this.planner.create(user.sub, body);
  }

  @Patch('planner/requirements/:id')
  updateRequirement(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(StaffingRequirementUpdateSchema)) body: StaffingRequirementUpdateData,
  ) {
    return this.planner.update(user.sub, id, body);
  }

  @Delete('planner/requirements/:id')
  removeRequirement(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.planner.remove(user.sub, id);
  }

  @Post('planner/requirements/:id/assign')
  assign(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(PlannerAssignSchema)) body: PlannerAssignData,
  ) {
    return this.planner.assign(user.sub, id, body);
  }

  @Get('planner/requirements/:id/candidates')
  candidates(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Query() query: { sources?: string },
  ) {
    return this.planner.candidates(user.sub, id, query.sources);
  }

  @Post('planner/requirements/:id/auto-fill')
  autoFill(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.planner.autoFill(user.sub, id);
  }

  // ---- Assignments ----
  @Post('planner/assignments/:id/respond')
  respond(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(PlannerRespondSchema)) body: PlannerRespondData,
  ) {
    return this.planner.respond(user.sub, id, body);
  }

  @Delete('planner/assignments/:id')
  unassign(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.planner.unassign(user.sub, id);
  }

  // ---- Summary ----
  @Get('planner/summary')
  summary(@CurrentUser() user: { sub: string }, @Query() query: { from?: string; to?: string }) {
    return this.planner.summary(user.sub, { from: query.from, to: query.to });
  }
}
