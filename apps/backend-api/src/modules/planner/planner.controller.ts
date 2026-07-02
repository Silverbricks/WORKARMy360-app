import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApplyTemplateSchema,
  ConfigCategorySchema,
  ConfigFieldSchema,
  ConfigGateSchema,
  ConfigGeneralSchema,
  ConfigRuleSchema,
  ConfigTermSchema,
  ConfigWorkflowSchema,
  ModuleToggleSchema,
  PlannerAssignSchema,
  PlannerCascadeSchema,
  PlannerCopySchema,
  PlannerFromTemplateSchema,
  PlannerPublishRangeSchema,
  PlannerReassignSchema,
  PlannerRepeatSchema,
  PlannerRespondSchema,
  RosterTemplateInputSchema,
  StaffingRequirementInputSchema,
  StaffingRequirementUpdateSchema,
  type ApplyTemplateData,
  type ConfigCategoryData,
  type ConfigFieldData,
  type ConfigGateData,
  type ConfigGeneralData,
  type ConfigRuleData,
  type ConfigTermData,
  type ConfigWorkflowData,
  type ModuleToggleData,
  type PlannerAssignData,
  type PlannerCascadeData,
  type PlannerCopyData,
  type PlannerFromTemplateData,
  type PlannerPublishRangeData,
  type PlannerRepeatData,
  type PlannerReassignData,
  type PlannerRespondData,
  type RosterTemplateInputData,
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

  @Patch('planner/config/rule')
  setRule(@CurrentUser() user: { sub: string }, @Body(new ZodValidationPipe(ConfigRuleSchema)) body: ConfigRuleData) {
    return this.config.setRule(user.sub, body);
  }

  @Delete('planner/config/rule/:key')
  removeRule(@CurrentUser() user: { sub: string }, @Param('key') key: string) {
    return this.config.removeRule(user.sub, key);
  }

  @Patch('planner/config/workflow')
  setWorkflow(@CurrentUser() user: { sub: string }, @Body(new ZodValidationPipe(ConfigWorkflowSchema)) body: ConfigWorkflowData) {
    return this.config.setWorkflow(user.sub, body);
  }

  // ---- Templates (saved shift templates) ----
  @Get('planner/templates')
  listTemplates(@CurrentUser() user: { sub: string }) {
    return this.planner.listTemplates(user.sub);
  }

  @Post('planner/templates')
  createTemplate(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(RosterTemplateInputSchema)) body: RosterTemplateInputData,
  ) {
    return this.planner.createTemplate(user.sub, body);
  }

  @Delete('planner/templates/:id')
  removeTemplate(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.planner.removeTemplate(user.sub, id);
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

  @Post('planner/requirements/from-template')
  fromTemplate(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(PlannerFromTemplateSchema)) body: PlannerFromTemplateData,
  ) {
    return this.planner.fromTemplate(user.sub, body);
  }

  @Post('planner/requirements/copy')
  copy(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(PlannerCopySchema)) body: PlannerCopyData,
  ) {
    return this.planner.copy(user.sub, body);
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

  @Post('planner/requirements/:id/publish')
  publish(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.planner.publish(user.sub, id);
  }

  @Post('planner/requirements/:id/repeat')
  repeat(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(PlannerRepeatSchema)) body: PlannerRepeatData,
  ) {
    return this.planner.repeat(user.sub, id, body);
  }

  @Post('planner/requirements/:id/cascade')
  cascade(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(PlannerCascadeSchema)) body: PlannerCascadeData,
  ) {
    return this.planner.cascade(user.sub, id, body.channels);
  }

  @Post('planner/requirements/:id/claim')
  claim(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.planner.claim(user.sub, id);
  }

  @Get('planner/open-shifts')
  openShifts(@CurrentUser() user: { sub: string }, @Query() query: { from?: string; to?: string }) {
    return this.planner.openShifts(user.sub, { from: query.from, to: query.to });
  }

  @Post('planner/publish')
  publishRange(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(PlannerPublishRangeSchema)) body: PlannerPublishRangeData,
  ) {
    return this.planner.publishRange(user.sub, body.from, body.to);
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

  @Post('planner/assignments/:id/reassign')
  reassign(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(PlannerReassignSchema)) body: PlannerReassignData,
  ) {
    return this.planner.reassign(user.sub, id, body.toPersonId);
  }

  // ---- Summary / Grid / Who's turning up ----
  @Get('planner/summary')
  summary(@CurrentUser() user: { sub: string }, @Query() query: { from?: string; to?: string }) {
    return this.planner.summary(user.sub, { from: query.from, to: query.to });
  }

  @Get('planner/grid')
  grid(@CurrentUser() user: { sub: string }, @Query() query: { weekStart?: string; days?: string }) {
    const days = query.days ? Math.min(35, Math.max(1, Number(query.days) || 7)) : 7;
    return this.planner.grid(user.sub, query.weekStart ?? mondayOf(new Date()), days);
  }

  @Get('planner/turnup')
  turnup(@CurrentUser() user: { sub: string }, @Query() query: { from?: string; to?: string }) {
    return this.planner.turnup(user.sub, { from: query.from, to: query.to });
  }

  @Get('planner/staff')
  staff(@CurrentUser() user: { sub: string }, @Query() query: { weekStart?: string }) {
    return this.planner.staffCards(user.sub, query.weekStart ?? mondayOf(new Date()));
  }

  @Get('planner/weather')
  weather(@CurrentUser() user: { sub: string }, @Query() query: { weekStart?: string }) {
    return this.planner.weather(user.sub, query.weekStart ?? mondayOf(new Date()));
  }

  // ---- Worker-facing (job-seeker app; person-scoped) ----
  @Get('planner/my-shifts')
  myShifts(@CurrentUser() user: { sub: string }) {
    return this.planner.myShifts(user.sub);
  }

  @Post('planner/my-shifts/:id/respond')
  myRespond(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(PlannerRespondSchema)) body: PlannerRespondData,
  ) {
    return this.planner.respondAsWorker(user.sub, id, body);
  }

  @Get('planner/marketplace')
  marketplace(@CurrentUser() user: { sub: string }) {
    return this.planner.marketplace(user.sub);
  }

  @Post('planner/marketplace/:id/claim')
  claimShift(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.planner.claim(user.sub, id);
  }
}

/** Monday of the given date's week, as YYYY-MM-DD (UTC). */
function mondayOf(d: Date): string {
  const u = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (u.getUTCDay() + 6) % 7;
  u.setUTCDate(u.getUTCDate() - day);
  return u.toISOString().slice(0, 10);
}
