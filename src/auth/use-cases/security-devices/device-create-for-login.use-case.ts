import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../../security/devices.repository';
import { JwtService } from '@nestjs/jwt';
import { Device } from '../../../security/entities/device.entity';

export class DeviceCreateCommand {
  constructor(
    public token: string,
    public ip: string,
    public userAgent: string,
  ) {}
}

@CommandHandler(DeviceCreateCommand)
export class DeviceCreateForLoginUseCase
  implements ICommandHandler<DeviceCreateCommand>
{
  constructor(
    private readonly devicesRepository: DevicesRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(command: DeviceCreateCommand): Promise<Device> {
    const decodedToken: any = this.jwtService.decode(command.token);

    const device = new Device();
    device.deviceId = decodedToken.deviceId;
    device.ip = command.ip;
    device.title = command.userAgent;
    device.lastActiveDate = decodedToken.iat;
    device.expirationDate = decodedToken.exp;
    device.user = decodedToken.sub;

    return this.devicesRepository.dataSourceSave(device);
  }
}
