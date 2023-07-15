import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      usernameField: 'loginOrEmail',
    });
  }

  async validate(loginOrEmail: string, password: string): Promise<any> {
    const checkRefToken = 1; /// write fun to check loginOrEmail and password

    if (!checkRefToken) {
      throw new UnauthorizedException();
    }

    return checkRefToken;
  }
}
