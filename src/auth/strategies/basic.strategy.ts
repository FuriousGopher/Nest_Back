import { BasicStrategy as Strategy } from 'passport-http';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  public validate = async (username, password): Promise<boolean> => {
    if (
      this.configService.get('SUPER_LOGIN') === username &&
      this.configService.get('SUPER_PASSWORD') === password
    ) {
      return true;
    }
    throw new UnauthorizedException();
  };
}
