import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RecoveryEmailDto } from './dto/recoveryEmail.dto';
import { NewPasswordDto } from './dto/new-password.dto';
import { InputForLoginDto } from './dto/Input-for-login.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { ConfirmationCodeDto } from './dto/confirmation-code.dto';
import { RegistrationDto } from './dto/registration.dto';
import { EmailResendingDto } from './dto/recoveryEmailResending.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    return await this.authService.newPas(newPasswordDto);
  }

  @UseGuards(ThrottlerGuard)
  @Post('login')
  async login(@Body() inputForLoginDto: InputForLoginDto) {
    return await this.authService.login(inputForLoginDto);
  }

  @Post('refresh-token')
  async refreshToken(@Body() inputForRefreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(inputForRefreshTokenDto);
  }

  @HttpCode(204)
  @UseGuards(ThrottlerGuard)
  @Post('registration-confirmation')
  async confirmationOfEmail(@Body() confirmationCode: ConfirmationCodeDto) {
    return await this.authService.confirmationOfEmail(confirmationCode);
  }

  @Post('registration-email-resending')
  async emailResending(emailResendingDto: EmailResendingDto) {
    return await this.authService.logout(emailResendingDto);
  }

  @HttpCode(204)
  @UseGuards(ThrottlerGuard)
  @Post('registration')
  async registration(@Body() registrationDto: RegistrationDto) {
    return await this.authService.registration(registrationDto);
  }

  @Post('logout')
  async logout() {
    return await this.authService.logout();
  }

  @Get('me')
  async findAll() {
    return this.authService.findAll();
  }
}
