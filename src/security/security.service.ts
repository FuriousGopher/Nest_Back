import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DevicesRepository } from './devices.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device } from '../db/schemas/device.schema';

@Injectable()
export class SecurityService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Device.name) private deviceModel: Model<Device>,
    @Inject(DevicesRepository)
    protected devicesRepository: DevicesRepository,
  ) {}

  findAll(userId: string) {
    return this.devicesRepository.findAll(userId);
  }

  async saveDeviceForLogin(
    refreshToken: string,
    ip: string,
    userAgent: string,
  ) {
    const decodeToken: any = this.jwtService.decode(refreshToken);
    const device = new this.deviceModel({
      ip: ip,
      title: userAgent,
      deviceId: decodeToken.deviceId,
      userId: decodeToken.sub,
      lastActiveDate: decodeToken.iat,
      expirationDate: decodeToken.exp,
    });
    return await this.devicesRepository.save(device);
  }

  async updateRefToken(newToken: any, ip: string, userAgent: string) {
    const foundDevice = await this.devicesRepository.findDevice(
      newToken.deviceId,
    );
    if (!foundDevice) {
      return null;
    }
    const deviceId = foundDevice.deviceId;

    const updateDevice = {
      lastActiveDate: newToken.iat,
      ip: ip,
      title: userAgent,
    };

    return await this.devicesRepository.updateDevice(deviceId, updateDevice);
  }

  deviceDelete(deviceId: string) {
    return this.devicesRepository.remove(deviceId);
  }

  removeOldOnes(deviceId: string, userId: string) {
    return this.devicesRepository.removeOldOnes(deviceId, userId);
  }

  findOne(deviceId: string) {
    return this.devicesRepository.findDevice(deviceId);
  }

  async removeById(deviceId: string, userId: string) {
    const foundDevice = await this.devicesRepository.findDevice(deviceId);
    if (!foundDevice) return false;
    if (foundDevice.userId !== userId) return false;
    return this.devicesRepository.remove(deviceId);
  }
}
