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
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(command: ValidateRefreshTokenCommand) {
    const userId = command.payload.sub;

    const user = this.usersRepository.findOne(userId);

    if (!user) {
      return false;
    }

    return user;
  }
}
