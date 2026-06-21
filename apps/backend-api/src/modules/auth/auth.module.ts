import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { TurnstileModule } from '../turnstile/turnstile.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { SessionService } from './session.service';

@Module({
  imports: [UsersModule, EmailModule, TurnstileModule, AuditModule],
  controllers: [AuthController],
  providers: [AuthService, OtpService, SessionService],
})
export class AuthModule {}
