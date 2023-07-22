import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Device, DeviceDocument } from '../db/schemas/device.schema';
import { Model } from 'mongoose';

@Injectable()
export class DevicesRepository {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
  ) {}

  async findAll(userId: string) {
    const foundDevices = await this.deviceModel.find({ userId });

    if (!foundDevices) {
      return false;
    }

    return foundDevices.map((device) => ({
      ip: device.ip,
      title: device.title,
      lastActiveDate: new Date(device.lastActiveDate * 1000).toISOString(),
      deviceId: device.deviceId,
    }));
  }

  async remove(deviceId: string) {
    const remove = await this.deviceModel.deleteOne({ deviceId: deviceId });
    return remove.deletedCount !== 0;
  }

  async findDevice(deviceId: string) {
    const found = await this.deviceModel.findOne({ deviceId: deviceId });
    if (!found) {
      return false;
    }
    return found;
  }

  async save(newDevice: DeviceDocument) {
    return await newDevice.save();
  }

  async updateDevice(
    deviceId: string,
    updateDevice: { ip: string; lastActiveDate: number; title: string },
  ) {
    return this.deviceModel.findOneAndUpdate(
      { deviceId: deviceId },
      updateDevice,
    );
  }

  removeOldOnes(deviceId: string, userId: string) {
    return this.deviceModel.deleteMany({
      deviceId: { $ne: deviceId },
      userId: userId,
    });
  }
}
