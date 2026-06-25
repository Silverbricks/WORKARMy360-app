import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  OrgWorkerInputSchema,
  OrgWorkerUpdateSchema,
  RosterAssignSchema,
  RosterInputSchema,
  RosterRespondSchema,
  TeamInputSchema,
  TeamMemberInputSchema,
  WorkerDirectoryQuerySchema,
  WorkerInviteSchema,
  type OrgWorkerInputData,
  type OrgWorkerUpdateData,
  type RosterAssignData,
  type RosterInputData,
  type RosterRespondData,
  type TeamInputData,
  type TeamMemberInputData,
  type WorkerDirectoryQueryData,
  type WorkerInviteData,
} from '@workarmy/validation';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { StaffService } from './staff.service';

@Controller()
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  // ---- Org workers ----
  @Get('org-workers')
  listWorkers(
    @CurrentUser() user: { sub: string },
    @Query() query: { onCall?: string; urgent?: string; staffType?: string },
  ) {
    return this.staff.listWorkers(user.sub, {
      onCall: query.onCall === 'true',
      urgent: query.urgent === 'true',
      staffType: query.staffType,
    });
  }

  @Post('org-workers')
  addWorker(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(OrgWorkerInputSchema)) body: OrgWorkerInputData,
  ) {
    return this.staff.addWorker(user.sub, body);
  }

  @Patch('org-workers/:id')
  updateWorker(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(OrgWorkerUpdateSchema)) body: OrgWorkerUpdateData,
  ) {
    return this.staff.updateWorker(user.sub, id, body);
  }

  @Delete('org-workers/:id')
  removeWorker(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.staff.removeWorker(user.sub, id);
  }

  // ---- Teams ----
  @Get('teams')
  listTeams(@CurrentUser() user: { sub: string }) {
    return this.staff.listTeams(user.sub);
  }

  @Post('teams')
  createTeam(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(TeamInputSchema)) body: TeamInputData,
  ) {
    return this.staff.createTeam(user.sub, body);
  }

  @Delete('teams/:id')
  removeTeam(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.staff.removeTeam(user.sub, id);
  }

  @Post('teams/:id/members')
  addTeamMember(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TeamMemberInputSchema)) body: TeamMemberInputData,
  ) {
    return this.staff.addTeamMember(user.sub, id, body);
  }

  @Delete('teams/:id/members/:memberId')
  removeTeamMember(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.staff.removeTeamMember(user.sub, id, memberId);
  }

  // ---- Worker directory ----
  @Get('worker-directory')
  browseDirectory(
    @CurrentUser() user: { sub: string },
    @Query(new ZodValidationPipe(WorkerDirectoryQuerySchema)) query: WorkerDirectoryQueryData,
  ) {
    return this.staff.browseDirectory(user.sub, query);
  }

  @Post('worker-directory/:waId/invite')
  invite(
    @CurrentUser() user: { sub: string },
    @Param('waId') waId: string,
    @Body(new ZodValidationPipe(WorkerInviteSchema)) body: WorkerInviteData,
  ) {
    return this.staff.invite(user.sub, waId, body.message);
  }

  // ---- Rosters ----
  @Get('rosters/turnup')
  turnup(@CurrentUser() user: { sub: string }) {
    return this.staff.turnup(user.sub);
  }

  @Get('rosters')
  listRosters(@CurrentUser() user: { sub: string }) {
    return this.staff.listRosters(user.sub);
  }

  @Post('rosters')
  createRoster(
    @CurrentUser() user: { sub: string },
    @Body(new ZodValidationPipe(RosterInputSchema)) body: RosterInputData,
  ) {
    return this.staff.createRoster(user.sub, body);
  }

  @Post('rosters/:id/assign')
  assignRoster(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RosterAssignSchema)) body: RosterAssignData,
  ) {
    return this.staff.assignRoster(user.sub, id, body.waId);
  }

  @Post('rosters/assignments/:id/respond')
  respondRoster(
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RosterRespondSchema)) body: RosterRespondData,
  ) {
    return this.staff.respondRoster(user.sub, id, body.response);
  }

  @Post('rosters/:id/publish')
  publishRoster(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.staff.publishRoster(user.sub, id);
  }
}
