import { Logger } from '@nestjs/common';
import type { EmailMessage, EmailProvider } from '../email.types';

/** Dev provider — prints the email (incl. OTP / reset link) to the server log. */
export class ConsoleEmailProvider implements EmailProvider {
  private readonly logger = new Logger('Email');

  async send(message: EmailMessage): Promise<void> {
    this.logger.log(
      `\n┌─ EMAIL (dev) ─────────────────────────────\n` +
        `│ To:      ${message.to}\n` +
        `│ Subject: ${message.subject}\n` +
        `│\n` +
        message.text
          .split('\n')
          .map((line) => `│ ${line}`)
          .join('\n') +
        `\n└───────────────────────────────────────────`,
    );
  }
}
