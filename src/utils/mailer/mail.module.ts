import {
  MailerModule,
  MailerOptions,
  MailerService,
} from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { join } from 'path';
import { MailAdapter } from './mail-adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService, MailerService],
      useFactory: async (
        configService: ConfigService,
        mailerService: MailerService,
      ) => {
        const mailAdapter = new MailAdapter(mailerService, configService);
        const mailAuth = mailAdapter.getMailAuth();

        return {
          transport: {
            port: 465,
            host: 'smtp.gmail.com',
            auth: {
              user: mailAuth.user,
              pass: mailAuth.pass,
            },
            secure: true,
          },
          defaults: {
            from: `"Admin" <${mailAuth.user}>`,
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        } as MailerOptions;
      },
    }),
  ],
  providers: [MailAdapter],
  exports: [MailAdapter],
})
export class MailModule {}
