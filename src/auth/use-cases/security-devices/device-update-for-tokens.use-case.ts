import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../../security/devices.repository';
import { Device } from '../../../security/entities/device.entity';

export class UpdateDeviceList {
  constructor(public token: any, public ip: string, public userAgent: string) {}
}

@CommandHandler(UpdateDeviceList)
export class DeviceUpdateForTokensUseCase
  implements ICommandHandler<UpdateDeviceList>
{
  constructor(private readonly devicesRepository: DevicesRepository) {}

  async execute(command: UpdateDeviceList): Promise<Device | null> {
    const device = await this.devicesRepository.findDevice(
      command.token.deviceId,
    );

    if (!device) {
      return null;
    }

    device.lastActiveDate = command.token.iat;
    device.ip = command.ip;
    device.title = command.userAgent;

    return this.devicesRepository.dataSourceSave(device);
  }
}
