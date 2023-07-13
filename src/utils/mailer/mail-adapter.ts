import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailAdapter {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  getMailAuth(): { pass: string | undefined; user: string | undefined } {
    const user = this.configService.get<string>('MY_EMAIL');
    const password = this.configService.get<string>('PASSWORD');
    return { user, pass: password };
  }

  async sendRegistrationMail(
    login: string,
    email: string,
    confirmationCode: string,
  ) {
    const url = `https://somesite.com/confirm-email?code=${confirmationCode}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Registration confirmation',
      template: './confirmation',
      context: {
        login: login,
        url,
      },
    });
  }

  async sendPasswordRecoveryMail(
    login: string,
    email: string,
    recoveryCode: string,
  ) {
    const url = `https://somesite.com/password-recovery?recoveryCode=${recoveryCode}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Password recovery',
      template: './password-recovery', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        login: login,
        url,
      },
    });
  }
}
