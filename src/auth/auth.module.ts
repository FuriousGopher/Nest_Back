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
import { SaModule } from '../sa/sa.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../db/schemas/users.schema';
import { CqrsModule } from '@nestjs/cqrs';
import { MailModule } from '../utils/mailer/mail.module';
import { TokensCreate } from './tokens/tokens-create';
import { ValidateRefreshToken } from './validators/validate-refresh-token';
import { SaRepository } from '../sa/sa.repository';
import { IsLoginExistConstraint } from '../decorators/unique-login.decorator';
import { IsEmailExistConstraint } from '../decorators/unique-email.decorator';
import { SecurityModule } from '../security/security.module';
import { DevicesRepository } from '../security/devices.repository';
import { Device, DeviceSchema } from '../db/schemas/device.schema';

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
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
    MailModule,
    CqrsModule,
    SecurityModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    ...strategies,
    TokensCreate,
    ConfigService,
    SaRepository,
    IsLoginExistConstraint,
    IsEmailExistConstraint,
    DevicesRepository,
    ValidateRefreshToken,
  ],
  exports: [AuthService, TokensCreate, ValidateRefreshToken],
})
export class AuthModule {}
