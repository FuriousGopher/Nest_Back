import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../users/users.repository';
import { JwtService } from '@nestjs/jwt';

export class ValidateRefreshTokenCommand {
  constructor(public payload: any) {}
}

@CommandHandler(ValidateRefreshTokenCommand)
export class ValidateRefreshToken
  implements ICommandHandler<ValidateRefreshTokenCommand>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(command: ValidateRefreshTokenCommand) {
    const decoded = this.jwtService.verify(command.payload.refreshToken);
    if (!decoded) return false;
    const userId = decoded.sub;

    const user = this.usersRepository.findOne(userId);

    if (!user) {
      return false;
    }

    return user;
  }
}
