import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../../security/devices.repository';

export class DevicesDeleteOldCommand {
  constructor(public deviceId: string, public userId: number) {}
}

@CommandHandler(DevicesDeleteOldCommand)
export class DevicesDeleteOldUseCase
  implements ICommandHandler<DevicesDeleteOldCommand>
{
  constructor(private readonly devicesRepository: DevicesRepository) {}

  async execute(command: DevicesDeleteOldCommand): Promise<boolean> {
    return this.devicesRepository.removeOldOnes(
      command.deviceId,
      command.userId,
    );
  }
}
