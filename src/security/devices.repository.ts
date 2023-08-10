import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeviceMongo, DeviceDocument } from '../db/schemas/device.schema';
import { Model } from 'mongoose';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Device } from './entities/device.entity';

@Injectable()
export class DevicesRepository {
  constructor(
    @InjectModel(DeviceMongo.name) private deviceModel: Model<DeviceDocument>,
    @InjectRepository(Device)
    private readonly devicesRepository: Repository<Device>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async dataSourceSave(entity: Device): Promise<Device> {
    return this.dataSource.manager.save(entity);
  }

  async findAll(userId: number) {
    const devices = await this.devicesRepository
      .createQueryBuilder('d')
      .where(`d.userId = :userId`, {
        userId: userId,
      })
      .getMany();

    return devices.map((d) => {
      return {
        ip: d.ip,
        title: d.title,
        lastActiveDate: new Date(d.lastActiveDate * 1000).toISOString(),
        deviceId: d.deviceId,
      };
    });
  }

  async remove(deviceId: string) {
    const remove = await this.deviceModel.deleteOne({ deviceId: deviceId });
    return remove.deletedCount !== 0;
  }

  async findDevice(deviceId: string) {
    try {
      return await this.devicesRepository
        .createQueryBuilder('d')
        .where(`d.deviceId = :deviceId`, { deviceId: deviceId })
        .leftJoinAndSelect('d.user', 'u')
        .getOne();
    } catch (e) {
      console.log(e);
      return null;
    }
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

  async deleteDevice(deviceId: string): Promise<boolean> {
    const result = await this.devicesRepository
      .createQueryBuilder('d')
      .delete()
      .from(Device)
      .where('deviceId = :deviceId', { deviceId: deviceId })
      .execute();
    return result.affected === 1;
  }

  async removeOldOnes(deviceId: string, userId: number): Promise<boolean> {
    const result = await this.devicesRepository
      .createQueryBuilder('d')
      .delete()
      .from(Device)
      .where('userId = :userId', { userId: userId })
      .andWhere('deviceId != :deviceId', { deviceId: deviceId })
      .execute();
    return result.affected === 1;
  }
}
