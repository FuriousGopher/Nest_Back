import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailAdapter {
  constructor(private mailerService: MailerService) {}

  async sendRegistrationMail(
    login: string,
    email: string,
    confirmationCode: string,
  ) {
    const url = `https://somesite.com/confirm-email?code=${confirmationCode}`;

    const text = `Dear ${login},\n\nPlease click on the following link to confirm your email:\n${url}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Registration confirmation',
      text: text,
    });
  }

  async sendPasswordRecoveryMail(
    login: string,
    email: string,
    recoveryCode: string,
  ) {
    const url = `https://somesite.com/password-recovery?recoveryCode=${recoveryCode}`;

    const text = `Dear ${login},\n\nPlease click on the following link to recover your password:\n${url}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Password recovery',
      text: text,
    });
  }
}
