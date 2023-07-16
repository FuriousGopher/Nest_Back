import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { BasicStrategy } from './strategies/basic.strategy';
import { ThrottlerModule } from '@nestjs/throttler';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtBearerStrategy } from './strategies/jwt-bearer.strategy';
import { JwtRefreshTokenStrategy } from './strategies/jwt-refresh.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UsersModule } from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../db/schemas/users.schema';
import { CommandBus } from '@nestjs/cqrs';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailAdapter } from '../utils/mailer/mail-adapter';

const strategies = [
  BasicStrategy,
  JwtBearerStrategy,
  LocalStrategy,
  JwtRefreshTokenStrategy,
];

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 10,
      limit: 5,
    }),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secretKey = configService.get<string>('SECRET_KEY');
        return {
          secret: secretKey,
          signOptions: { expiresIn: '3m' },
        };
      },
    }),
    ConfigModule,
    UsersModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MailerModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    ...strategies,
    CommandBus,
    MailAdapter,
    ConfigService,
  ],
})
export class AuthModule {}
