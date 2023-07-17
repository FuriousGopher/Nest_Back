import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { refTokFromCookieExtractor } from '../../utils/refTokFromCookie.extractor';
import { ValidateRefreshTokenCommand } from '../validators/validate-refresh-token';
import { CommandBus } from '@nestjs/cqrs';

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private commandBus: CommandBus,
  ) {
    super({
      jwtFromRequest: refTokFromCookieExtractor,
      ignoreExpiration: false,
      secretOrKey: configService.get('SECRET_KEY'),
    });
  }

  async validate(payload: any) {
    console.log('payload', payload);
    const result = await this.commandBus.execute(
      new ValidateRefreshTokenCommand(payload),
    );

    if (!result) {
      throw new UnauthorizedException();
    }

    return {
      id: payload.sub,
    };
  }
}
