import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ValidateLoginAndPasswordCommand } from '../use-cases/validators/validate-login-pass.use-case';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private commandBus: CommandBus) {
    super({
      usernameField: 'loginOrEmail',
    });
  }

  async validate(loginOrEmail: string, password: string): Promise<any> {
    const checkLoginInput = await this.commandBus.execute(
      new ValidateLoginAndPasswordCommand(loginOrEmail, password),
    );
    if (!checkLoginInput) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return checkLoginInput;
  }
}
