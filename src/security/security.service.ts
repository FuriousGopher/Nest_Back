import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DevicesRepository } from './devices.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeviceMongo } from '../db/schemas/device.schema';

@Injectable()
export class SecurityService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(DeviceMongo.name) private deviceModel: Model<DeviceMongo>,
    @Inject(DevicesRepository)
    protected devicesRepository: DevicesRepository,
  ) {}

  findAll(userId: string) {
    return this.devicesRepository.findAll(+userId);
  }

  findOne(deviceId: string) {
    return this.devicesRepository.findDevice(deviceId);
  }
}
