import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../../security/devices.repository';

export class DeviceDeleteAfterLogOut {
  constructor(public deviceId: string) {}
}

@CommandHandler(DeviceDeleteAfterLogOut)
export class DeviceDeleteForLogoutUseCase
  implements ICommandHandler<DeviceDeleteAfterLogOut>
{
  constructor(private readonly devicesRepository: DevicesRepository) {}

  async execute(command: DeviceDeleteAfterLogOut): Promise<boolean> {
    return this.devicesRepository.deleteDevice(command.deviceId);
  }
}
