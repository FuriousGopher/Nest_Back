import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { v4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

export class TokensCreateCommand {
  constructor(
    public userId: string,
    public deviceId = v4().replace(/-/g, ''),
  ) {}
}

@CommandHandler(TokensCreateCommand)
export class TokensCreate implements ICommandHandler<TokensCreateCommand> {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: TokensCreateCommand) {
    const accessTokenPayload = { sub: command.userId };
    const refreshTokenPayload = {
      sub: command.userId,
      deviceId: command.deviceId,
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: this.configService.get('SECRET_KEY'),
      expiresIn: '10m',
    });

    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: this.configService.get('SECRET_KEY'),
      expiresIn: '10m',
    });

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }
}
