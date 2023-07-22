import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from '../db/schemas/device.schema';
import { JwtBearerStrategy } from '../auth/strategies/jwt-bearer.strategy';
import { JwtRefreshTokenStrategy } from '../auth/strategies/jwt-refresh.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { DevicesRepository } from './devices.repository';

const strategies = [JwtBearerStrategy, JwtRefreshTokenStrategy];

@Module({
  controllers: [SecurityController],
  providers: [SecurityService, ...strategies, ConfigService, DevicesRepository],
  imports: [
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
    PassportModule,
    JwtModule,
    ConfigModule,
    CqrsModule,
  ],
  exports: [SecurityService, DevicesRepository],
})
export class SecurityModule {}
