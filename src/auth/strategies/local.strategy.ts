import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'loginOrEmail',
    });
  }

  async validate(loginOrEmail: string, password: string): Promise<any> {
    const checkLoginInput = await this.authService.checkCredentials(
      loginOrEmail,
      password,
    );
    if (!checkLoginInput) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return checkLoginInput;
  }
}
