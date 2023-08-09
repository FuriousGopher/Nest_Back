import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DeviceMongo, DeviceSchema } from '../db/schemas/device.schema';
import { JwtBearerStrategy } from '../auth/strategies/jwt-bearer.strategy';
import { JwtRefreshTokenStrategy } from '../auth/strategies/jwt-refresh.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { DevicesRepository } from './devices.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { DeviceDeleteForTerminateUseCase } from '../auth/use-cases/security-devices/device-delete-for-terminate.use-case';
import { DevicesDeleteOldUseCase } from '../auth/use-cases/security-devices/devices-delete-old.use-case';

const strategies = [JwtBearerStrategy, JwtRefreshTokenStrategy];

const useCases = [DeviceDeleteForTerminateUseCase, DevicesDeleteOldUseCase];
const entities = [Device];

@Module({
  controllers: [SecurityController],
  providers: [
    SecurityService,
    ...strategies,
    ConfigService,
    DevicesRepository,
    ...useCases,
  ],
  imports: [
    MongooseModule.forFeature([
      { name: DeviceMongo.name, schema: DeviceSchema },
    ]),
    TypeOrmModule.forFeature([...entities]),
    PassportModule,
    JwtModule,
    ConfigModule,
    CqrsModule,
  ],
  exports: [SecurityService, DevicesRepository],
})
export class SecurityModule {}
