import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Ip,
  Post,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { ThrottlerGuard } from '@nestjs/throttler';
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
import { UsersRepository } from '../users/users.repository';
import { exceptionHandler } from '../exceptions/exception.handler';
import { ResultCode } from '../enums/result-code.enum';
import {
  confirmCodeField,
  confirmCodeIsIncorrect,
  emailField,
  userNotFoundOrConfirmed,
} from '../exceptions/exception.constants';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private commandBus: CommandBus,
    private readonly usersRepository: UsersRepository,
  ) {}

  @HttpCode(204)
  @UseGuards(ThrottlerGuard)
  @Post('password-recovery') //work
  async pasRecovery(@Body() recoveryDto: RecoveryEmailDto) {
    return await this.authService.recoveryPass(recoveryDto);
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

  @UseGuards(ThrottlerGuard)
  @UseGuards(LocalAuthGuard)
  @Post('login') //work
  @HttpCode(200)
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    const userId = req.user.id;
    /*const userAgent = headers['user-agent'] || 'unknown';*/
    const tokens = await this.commandBus.execute(
      new TokensCreateCommand(userId),
    );
    res
      .cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
      })
      .json({ accessToken: tokens.accessToken });
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh-token') /// work
  @HttpCode(200)
  async refreshToken(
    @UserIdFromGuard() userId,
    @Ip() ip,
    @Headers() headers,
    @RefreshToken() refreshToken,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.commandBus.execute(
      new TokensCreateCommand(userId),
    );

    res
      .cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
      })
      .json({ accessToken: tokens.accessToken });
  }

  @HttpCode(204)
  @UseGuards(ThrottlerGuard)
  @Post('registration-confirmation') /// work
  async confirmationOfEmail(@Body() confirmationCode: ConfirmationCodeDto) {
    const result = await this.authService.confirmationOfEmail(confirmationCode);

    if (!result) {
      return exceptionHandler(
        ResultCode.BadRequest,
        confirmCodeIsIncorrect,
        confirmCodeField,
      );
    }

    return result;
  }

  @Post('registration-email-resending') /// work
  @HttpCode(204)
  async emailResending(@Body() emailResendingDto: RecoveryEmailDto) {
    const resend = await this.authService.emailResending(emailResendingDto);

    if (!resend) {
      return exceptionHandler(
        ResultCode.BadRequest,
        userNotFoundOrConfirmed,
        emailField,
      );
    }

    return resend;
  }

  @HttpCode(204)
  @UseGuards(ThrottlerGuard)
  @Post('registration') /// work
  async registration(@Body() registrationDto: RegistrationDto) {
    return await this.authService.registration(registrationDto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('logout') /// work
  @HttpCode(204)
  async logout(@Res() res) {
    res
      .cookie('refreshToken', '', {
        httpOnly: true,
        secure: true,
      })
      .json({ accessToken: '' });
  }

  @UseGuards(JwtRefreshGuard)
  @Get('me') /// work
  async getMe(@UserIdFromGuard() userId) {
    const user = await this.usersRepository.findOne(userId);

    if (!user) throw new Error('User not found');

    return {
      email: user.accountData.email,
      login: user.accountData.login,
      userId: user._id.toString(),
    };
  }
}
