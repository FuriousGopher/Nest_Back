import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailAdapter } from './mail-adapter';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          transport: {
            port: 465,
            host: 'smtp.gmail.com',
            auth: {
              user: configService.get<string>('MY_EMAIL'),
              pass: configService.get<string>('PASSWORD'),
            },
            secure: true,
          },
          defaults: {
            from: `"Admin" <${configService.get<string>('MY_EMAIL')}>`,
          },
        } as MailerOptions;
      },
    }),
  ],
  providers: [MailAdapter],
  exports: [MailAdapter],
})
export class MailModule {}
