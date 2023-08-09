import { RecoveryEmailDto } from '../../dto/recoveryEmail.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MailAdapter } from '../../../utils/mailer/mail-adapter';
import { SaRepository } from '../../../sa/sa.repository';
import { v4 } from 'uuid';
import { add } from 'date-fns';

export class RegistrationEmailResendCommand {
  constructor(public emailInputDto: RecoveryEmailDto) {}
}

@CommandHandler(RegistrationEmailResendCommand)
export class RegistrationEmailResendUseCase
  implements ICommandHandler<RegistrationEmailResendCommand>
{
  constructor(
    private readonly usersRepository: SaRepository,
    private readonly mailAdapter: MailAdapter,
  ) {}

  async execute(
    command: RegistrationEmailResendCommand,
  ): Promise<boolean | null> {
    const user = await this.usersRepository.findUserForEmailResendSQL(
      command.emailInputDto.email,
    );

    if (!user || user.isConfirmed) {
      return null;
    }

    const newConfirmationCode = v4();
    user!.userEmailConfirmation!.confirmationCode = newConfirmationCode;
    user.userEmailConfirmation!.expirationDate = add(new Date(), { hours: 1 });
    await this.usersRepository.dataSourceSaveSQL(user.userEmailConfirmation!);

    await this.resendRegistrationMail(
      user.login,
      user.email,
      newConfirmationCode,
    );

    return true;
  }

  private async resendRegistrationMail(
    login: string,
    email: string,
    confirmationCode: string,
  ): Promise<any> {
    try {
      await this.mailAdapter.sendRegistrationMail(
        login,
        email,
        confirmationCode,
      );
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}
