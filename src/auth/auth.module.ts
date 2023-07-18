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
import { CqrsModule } from '@nestjs/cqrs';
import { MailModule } from '../utils/mailer/mail.module';
import { TokensCreate } from './tokens/tokens-create';
import { ValidateRefreshToken } from './validators/validate-refresh-token';
import { UsersRepository } from '../users/users.repository';
import { IsLoginExistConstraint } from '../decorators/unique-login.decorator';
import { IsEmailExistConstraint } from '../decorators/unique-email.decorator';

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
    JwtModule,
    ConfigModule,
    UsersModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MailModule,
    CqrsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    ...strategies,
    TokensCreate,
    ConfigService,
    UsersRepository,
    IsLoginExistConstraint,
    IsEmailExistConstraint,
    ValidateRefreshToken,
  ],
  exports: [AuthService, TokensCreate, ValidateRefreshToken],
})
export class AuthModule {}
