import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Ip,
  Post,
  Response,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RecoveryEmailDto } from './dto/recoveryEmail.dto';
import { NewPasswordDto } from './dto/new-password.dto';
import { ConfirmationCodeDto } from './dto/confirmation-code.dto';
import { RegistrationDto } from './dto/registration.dto';
import { EmailResendingDto } from './dto/recoveryEmailResending.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { UserIdFromGuard } from '../decorators/user-id-from-guard.decorator';
import { CommandBus } from '@nestjs/cqrs';
import { TokensCreateCommand } from './tokens/tokens-create';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RefreshToken } from '../decorators/refresh-token.decorator';
import { JwtBearerGuard } from './guards/jwt-bearer.guard';
import { UsersRepository } from '../users/users.repository';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly commandBus: CommandBus,
    private readonly usersRepository: UsersRepository,
  ) {}

  @HttpCode(204)
  @UseGuards(ThrottlerGuard)
  @Post('password-recovery')
  async pasRecovery(@Body() recoveryDto: RecoveryEmailDto) {
    return await this.authService.recoveryPass(recoveryDto);
  }

  @HttpCode(204)
  @UseGuards(ThrottlerGuard)
  @Post('new-password')
  async newPas(@Body() newPasswordDto: NewPasswordDto) {
    return await this.authService.newPas(
      newPasswordDto.newPassword,
      newPasswordDto.recoveryCode,
    );
  }

  @UseGuards(ThrottlerGuard)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  async login(
    @UserIdFromGuard() userId,
    @Ip() ip,
    @Headers() headers,
    @Response() res,
  ) {
    /*const userAgent = headers['user-agent'] || 'unknown';*/
    const tokens = await this.commandBus.execute(
      new TokensCreateCommand(userId),
    );
    res
      .cookies('refreshToken', tokens.refreshToken, {
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
    @Response() res,
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
  @Post('registration-confirmation')
  async confirmationOfEmail(@Body() confirmationCode: ConfirmationCodeDto) {
    return await this.authService.confirmationOfEmail(confirmationCode);
  }

  @Post('registration-email-resending')
  async emailResending(emailResendingDto: EmailResendingDto) {
    return await this.authService.emailResending(emailResendingDto);
  }

  @HttpCode(204)
  @UseGuards(ThrottlerGuard)
  @Post('registration')
  async registration(@Body() registrationDto: RegistrationDto) {
    return await this.authService.registration(registrationDto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('logout')
  @HttpCode(204)
  async logout(@Response() res) {
    res
      .cookie('refreshToken', '', {
        httpOnly: true,
        secure: true,
      })
      .json({ accessToken: '' });
  }

  @UseGuards(JwtBearerGuard)
  @Get('me')
  async getMe(@UserIdFromGuard() userId) {
    const user = await this.usersRepository.findOne(userId);

    if (!user) throw new Error('User not found');

    return {
      email: user.accountData.email,
      login: user.accountData.login,
      userId: user.id,
    };
  }
}
