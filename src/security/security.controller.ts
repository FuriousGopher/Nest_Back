import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { SecurityService } from './security.service';
import { JwtRefreshGuard } from '../auth/guards/jwt-refresh.guard';
import { UserIdFromGuard } from '../decorators/user-id-from-guard.decorator';
import { RefreshToken } from '../decorators/refresh-token.decorator';
import { JwtService } from '@nestjs/jwt';
import { exceptionHandler } from '../exceptions/exception.handler';
import { ResultCode } from '../enums/result-code.enum';
import { CommandBus } from '@nestjs/cqrs';
import { DeviceDeleteById } from '../auth/use-cases/security-devices/device-delete-for-terminate.use-case';
import { DevicesDeleteOldCommand } from '../auth/use-cases/security-devices/devices-delete-old.use-case';

@Controller('security')
export class SecurityController {
  constructor(
    private readonly securityService: SecurityService,
    private readonly jwtService: JwtService,
    private commandBus: CommandBus,
  ) {}

  @UseGuards(JwtRefreshGuard)
  @Get('devices')
  findAll(@UserIdFromGuard() userId) {
    return this.securityService.findAll(userId);
  }

  @UseGuards(JwtRefreshGuard)
  @Delete('devices')
  @HttpCode(204)
  removeAllButOne(@RefreshToken() refreshToken, @UserIdFromGuard() userId) {
    const decodedToken: any = this.jwtService.decode(refreshToken);
    const deviceId = decodedToken?.deviceId;
    return this.commandBus.execute(
      new DevicesDeleteOldCommand(deviceId, userId),
    );
  }

  @UseGuards(JwtRefreshGuard)
  @Delete('devices/:id')
  @HttpCode(204)
  async removeById(@Param('id') deviceId, @UserIdFromGuard() userId) {
    const checkId = await this.securityService.findOne(deviceId);
    if (!checkId) {
      return exceptionHandler(
        ResultCode.NotFound,
        `Device with id ${deviceId} not found`,
        'id',
      );
    }

    const result = await this.commandBus.execute(
      new DeviceDeleteById(deviceId, userId),
    );

    if (!result) {
      return exceptionHandler(
        ResultCode.Forbidden,
        `You don't have permission to delete this device`,
        'id',
      );
    }
    return result;
  }
}
