import { Global, Module } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { AdminGuard } from '../guards/admin.guard';

@Global()
@Module({
  providers: [MembershipService, AdminGuard],
  exports: [MembershipService, AdminGuard],
})
export class MembershipModule {}
