import { ConfirmationCodeDto } from '../../dto/confirmation-code.dto';
import { CommandHandler } from '@nestjs/cqrs';
import { TransactionBaseUseCase } from '../../application/use-cases/transaction-base.use-case';
import { DataSource, EntityManager } from 'typeorm';
import { SaRepository } from '../../../sa/sa.repository';

export class RegistrationConfirmationCommand {
  constructor(public confirmCodeInputDto: ConfirmationCodeDto) {}
}

@CommandHandler(RegistrationConfirmationCommand)
export class RegistrationConfirmationUseCase extends TransactionBaseUseCase<
  RegistrationConfirmationCommand,
  boolean | null
> {
  constructor(
    protected readonly dataSource: DataSource,
    protected readonly usersRepository: SaRepository,
  ) {
    super(dataSource);
  }

  async doLogic(
    command: RegistrationConfirmationCommand,
    manager: EntityManager,
  ): Promise<boolean | null> {
    const user = await this.usersRepository.findUserForEmailConfirmSQL(
      command.confirmCodeInputDto.code,
    );

    if (
      !user! ||
      user.isConfirmed ||
      user!.userEmailConfirmation!.expirationDate! < new Date()
    ) {
      return null;
    }

    user.isConfirmed = true;
    await this.usersRepository.queryRunnerSave(user, manager);
    return this.usersRepository.deleteEmailConfirmationForUser(user.id);
  }

  public async execute(command: RegistrationConfirmationCommand) {
    return super.execute(command);
  }
}
