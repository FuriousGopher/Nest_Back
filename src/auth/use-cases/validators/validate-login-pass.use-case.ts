import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SaRepository } from '../../../sa/sa.repository';
import * as bcrypt from 'bcryptjs';

export class ValidateLoginAndPasswordCommand {
  constructor(public loginOrEmail: string, public password: string) {}
}

@CommandHandler(ValidateLoginAndPasswordCommand)
export class ValidateLoginAndPasswordUseCase
  implements ICommandHandler<ValidateLoginAndPasswordCommand>
{
  constructor(private readonly usersRepository: SaRepository) {}

  async execute(command: ValidateLoginAndPasswordCommand) {
    const user = await this.usersRepository.findUserByLoginOrEmail(
      command.loginOrEmail,
    );

    if (!user || !user.isConfirmed || user.userBanBySA.isBanned) {
      return null;
    }

    const result = await bcrypt.compare(command.password, user.passwordHash);

    if (result) {
      return user;
    }

    return null;
  }
}
