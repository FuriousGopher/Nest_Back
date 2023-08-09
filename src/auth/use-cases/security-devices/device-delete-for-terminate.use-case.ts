import { ExceptionResultType } from '../../../exceptions/types/exception-result.type';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../../security/devices.repository';
import { ResultCode } from '../../../enums/result-code.enum';

export class DeviceDeleteById {
  constructor(public deviceId: string, public userId: number) {}
}

@CommandHandler(DeviceDeleteById)
export class DeviceDeleteForTerminateUseCase
  implements ICommandHandler<DeviceDeleteById>
{
  constructor(private readonly devicesRepository: DevicesRepository) {}

  async execute(command: DeviceDeleteById) {
    const device = await this.devicesRepository.findDevice(command.deviceId);

    if (!device) {
      return false;
    }

    if (device.user.id !== command.userId) {
      return false;
    }

    await this.devicesRepository.deleteDevice(command.deviceId);

    return true;
  }
}
