import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Ip,
  Post,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { RecoveryEmailDto } from './dto/recoveryEmail.dto';
import { NewPasswordDto } from './dto/new-password.dto';
import { ConfirmationCodeDto } from './dto/confirmation-code.dto';
import { RegistrationDto } from './dto/registration.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { UserIdFromGuard } from '../decorators/user-id-from-guard.decorator';
import { CommandBus } from '@nestjs/cqrs';
import { TokensCreateCommand } from './tokens/tokens-create';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RefreshToken } from '../decorators/refresh-token.decorator';
import { SaRepository } from '../sa/sa.repository';
import { exceptionHandler } from '../exceptions/exception.handler';
import { ResultCode } from '../enums/result-code.enum';
import {
  confirmCodeField,
  confirmCodeIsIncorrect,
  emailField,
  userNotFoundOrConfirmed,
} from '../exceptions/exception.constants';
import { SecurityService } from '../security/security.service';
import { JwtService } from '@nestjs/jwt';
import { UserIdFromHeaders } from '../decorators/user-id-from-headers.decorator';
import { JwtBearerGuard } from './guards/jwt-bearer.guard';
import { ThrottleLogin } from '../decorators/throttle.decorator';
import { RegistrationCommand } from './use-cases/registration/registration.use-case';
import { RegistrationConfirmationCommand } from './use-cases/registration/registration-confirmation.use-case';
import { RegistrationEmailResendCommand } from './use-cases/registration/registration-email-resend.use-case';
import { DeviceCreateCommand } from './use-cases/security-devices/device-create-for-login.use-case';
import { UpdateDeviceList } from './use-cases/security-devices/device-update-for-tokens.use-case';
import { DeviceDeleteAfterLogOut } from './use-cases/security-devices/device-delete-for-logout.use-case';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private commandBus: CommandBus,
    private readonly usersRepository: SaRepository,
    private readonly jwtService: JwtService,
  ) {}

  @HttpCode(204)
  @UseGuards(ThrottlerGuard)
  @Post('registration')
  async registration(@Body() registrationDto: RegistrationDto) {
    return this.commandBus.execute(new RegistrationCommand(registrationDto));
  }

  @HttpCode(204)
  @UseGuards(ThrottlerGuard)
  @Post('registration-confirmation') /// work
  async confirmationOfEmail(@Body() confirmationCode: ConfirmationCodeDto) {
    const result = await this.commandBus.execute(
      new RegistrationConfirmationCommand(confirmationCode),
    );
    if (!result) {
      return exceptionHandler(
        ResultCode.BadRequest,
        'Code is incorrect',
        'code',
      );
    }
    return result;
  }

  @UseGuards(ThrottlerGuard)
  @Post('registration-email-resending') /// work
  @HttpCode(204)
  async emailResending(@Body() emailResendingDto: RecoveryEmailDto) {
    const result = await this.commandBus.execute(
      new RegistrationEmailResendCommand(emailResendingDto),
    );

    if (!result) {
      return exceptionHandler(
        ResultCode.BadRequest,
        'Email is not found or already confirmed',
        'email',
      );
    }

    return result;
  }

  @HttpCode(204)
  @UseGuards(ThrottlerGuard)
  @Post('password-recovery') //work
  async pasRecovery(@Body() recoveryDto: RecoveryEmailDto) {
    return;
  }

  @HttpCode(204)
  @UseGuards(ThrottlerGuard)
  @Post('new-password') //work
  async newPas(@Body() newPasswordDto: NewPasswordDto) {
    return await this.authService.newPas(
      newPasswordDto.newPassword,
      newPasswordDto.recoveryCode,
    );
  }

  @UseGuards(ThrottlerGuard, LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  async login(
    @Res({ passthrough: true }) res: Response,
    @UserIdFromGuard() userId: any,
    @Ip() ip: any,
    @Headers() headers: any,
  ) {
    const userAgent = headers['user-agent'] || 'unknown';

    const tokens = await this.commandBus.execute(
      new TokensCreateCommand(userId),
    );

    await this.commandBus.execute(
      new DeviceCreateCommand(tokens.refreshToken, ip, userAgent),
    );

    res
      .cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
      })
      .json({ accessToken: tokens.accessToken });
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh-token')
  @HttpCode(200)
  async refreshToken(
    @UserIdFromGuard() userId,
    @Ip() ip,
    @Headers() headers,
    @RefreshToken() refreshToken,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('refreshToken', refreshToken);
    console.log('userId', userId);
    const userAgent = headers['user-agent'] || 'unknown';
    const decodedToken: any = this.jwtService.decode(refreshToken);
    const deviceId = decodedToken.deviceId;

    const tokens = await this.commandBus.execute(
      new TokensCreateCommand(userId, deviceId),
    );

    const newToken = this.jwtService.decode(tokens.refreshToken);

    await this.commandBus.execute(
      new UpdateDeviceList(newToken, ip, userAgent),
    );

    res
      .cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
      })
      .json({ accessToken: tokens.accessToken });
  }

  @UseGuards(JwtRefreshGuard)
  @Post('logout')
  @HttpCode(204)
  async logout(@RefreshToken() refreshToken) {
    const decodedToken: any = this.jwtService.decode(refreshToken);
    const deviceId = decodedToken.deviceId;
    return this.commandBus.execute(new DeviceDeleteAfterLogOut(deviceId));
  }

  @UseGuards(JwtBearerGuard)
  @Get('me')
  async getMe(@UserIdFromHeaders() userId: string) {
    const user = await this.usersRepository.findUserByIdSQL(+userId);
    if (!user) throw new Error('User not found');

    return {
      email: user.email,
      login: user.login,
      userId: userId.toString(),
    };
  }
}
