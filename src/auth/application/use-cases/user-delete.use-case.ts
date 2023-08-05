import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SaRepository } from '../../../sa/sa.repository';

export class UserDeleteCommand {
  constructor(public userId: string) {}
}

@CommandHandler(UserDeleteCommand)
export class UserDeleteUseCase implements ICommandHandler<UserDeleteCommand> {
  constructor(private readonly usersRepository: SaRepository) {}

  async execute(command: UserDeleteCommand): Promise<boolean> {
    const user = await this.usersRepository.findUserByIdSQL(+command.userId);

    if (!user) {
      return false;
    }

    return this.usersRepository.deleteUserSQL(+command.userId);
  }
}
