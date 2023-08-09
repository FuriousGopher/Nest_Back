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
import { MongooseModule } from '@nestjs/mongoose';
import { UserMongo, UserSchema } from '../db/schemas/users.schema';
import { CqrsModule } from '@nestjs/cqrs';
import { MailModule } from '../utils/mailer/mail.module';
import { TokensCreate } from './tokens/tokens-create';
import { ValidateRefreshTokenUseCase } from './use-cases/validators/validate-refresh-token.use-case';
import { SaRepository } from '../sa/sa.repository';
import { IsLoginExistConstraint } from '../decorators/unique-login.decorator';
import { IsEmailExistConstraint } from '../decorators/unique-email.decorator';
import { SecurityModule } from '../security/security.module';
import { DevicesRepository } from '../security/devices.repository';
import { DeviceMongo, DeviceSchema } from '../db/schemas/device.schema';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RegistrationUseCase } from './use-cases/registration/registration.use-case';
import { MailAdapter } from '../utils/mailer/mail-adapter';
import { RegistrationConfirmationUseCase } from './use-cases/registration/registration-confirmation.use-case';
import { UserEmailConfirmation } from './entities/user-email-confirmation.entity';
import { RegistrationEmailResendUseCase } from './use-cases/registration/registration-email-resend.use-case';
import { ValidateLoginAndPasswordUseCase } from './use-cases/validators/validate-login-pass.use-case';
import { DeviceCreateForLoginUseCase } from './use-cases/security-devices/device-create-for-login.use-case';
import { Device } from '../security/entities/device.entity';
import { DeviceUpdateForTokensUseCase } from './use-cases/security-devices/device-update-for-tokens.use-case';
import { DeviceDeleteForLogoutUseCase } from './use-cases/security-devices/device-delete-for-logout.use-case';

const strategies = [
  BasicStrategy,
  JwtBearerStrategy,
  LocalStrategy,
  JwtRefreshTokenStrategy,
];

const entities = [User, UserEmailConfirmation, Device];

const useCases = [
  MailAdapter,
  RegistrationUseCase,
  RegistrationConfirmationUseCase,
  RegistrationEmailResendUseCase,
  ValidateLoginAndPasswordUseCase,
  /* PasswordRecoveryUseCase,
  PasswordUpdateUseCase,*/
  DeviceCreateForLoginUseCase,
  DeviceUpdateForTokensUseCase,
  DeviceDeleteForLogoutUseCase,
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
    MongooseModule.forFeature([{ name: UserMongo.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: DeviceMongo.name, schema: DeviceSchema },
    ]),
    MailModule,
    CqrsModule,
    SecurityModule,
    TypeOrmModule.forFeature([...entities]),
  ],
  controllers: [AuthController],
  providers: [
    ...useCases,
    AuthService,
    ...strategies,
    TokensCreate,
    ConfigService,
    SaRepository,
    IsLoginExistConstraint,
    IsEmailExistConstraint,
    DevicesRepository,
    ValidateRefreshTokenUseCase,
  ],
  exports: [AuthService, TokensCreate, ValidateRefreshTokenUseCase],
})
export class AuthModule {}
