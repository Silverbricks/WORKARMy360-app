import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtAccessGuard } from './common/guards/jwt-access.guard';
import { MembershipModule } from './common/membership/membership.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PersonsModule } from './modules/persons/persons.module';
import { FilesModule } from './modules/files/files.module';
import { CredentialsModule } from './modules/credentials/credentials.module';
import { ResumeModule } from './modules/resume/resume.module';
import { WorkModule } from './modules/work/work.module';
import { WorkLogModule } from './modules/worklog/worklog.module';
import { CommunityModule } from './modules/community/community.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SupportModule } from './modules/support/support.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ServicesModule } from './modules/services/services.module';
import { OrganisationsModule } from './modules/organisations/organisations.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    MembershipModule,
    AuthModule,
    PersonsModule,
    FilesModule,
    CredentialsModule,
    ResumeModule,
    WorkModule,
    WorkLogModule,
    CommunityModule,
    NotificationsModule,
    SupportModule,
    MessagesModule,
    ServicesModule,
    OrganisationsModule,
    JobsModule,
    ApplicationsModule,
    AdminModule,
  ],
  providers: [
    // Order matters: rate-limit before auth.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAccessGuard },
  ],
})
export class AppModule {}
