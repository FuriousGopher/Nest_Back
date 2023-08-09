import { TransactionBaseUseCase } from '../../application/use-cases/transaction-base.use-case';
import { CommandHandler } from '@nestjs/cqrs';
import { DataSource, EntityManager } from 'typeorm';
import { MailAdapter } from '../../../utils/mailer/mail-adapter';
import { SaRepository } from '../../../sa/sa.repository';
import { RegistrationDto } from '../../dto/registration.dto';
import { User } from '../../entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { UserBanBySA } from '../../entities/user-ban-by-sa.entity';
import { UserBanByBlogger } from '../../entities/user-ban-by-blogger.entity';
import { UserEmailConfirmation } from '../../entities/user-email-confirmation.entity';
import { add } from 'date-fns';
import { v4 } from 'uuid';

export class RegistrationCommand {
  constructor(public userInputDto: RegistrationDto) {}
}

@CommandHandler(RegistrationCommand)
export class RegistrationUseCase extends TransactionBaseUseCase<
  RegistrationCommand,
  number
> {
  constructor(
    protected readonly dataSource: DataSource,
    protected readonly usersRepository: SaRepository,
    protected readonly mailAdapter: MailAdapter,
  ) {
    super(dataSource);
  }

  async doLogic(command: RegistrationCommand, manager: EntityManager) {
    const user = new User();
    user.login = command.userInputDto.login;
    user.passwordHash = await bcrypt.hash(command.userInputDto.password, 10);
    user.email = command.userInputDto.email;
    user.isConfirmed = false;
    const savedUser = await this.usersRepository.queryRunnerSave(user, manager);

    const userBanBySA = new UserBanBySA();
    userBanBySA.user = user;
    userBanBySA.isBanned = false;
    await this.usersRepository.queryRunnerSave(userBanBySA, manager);

    const userBanByBlogger = new UserBanByBlogger();
    userBanByBlogger.user = user;
    userBanByBlogger.isBanned = false;

    await this.usersRepository.queryRunnerSave(userBanByBlogger, manager);

    const confirmationCode = v4();
    const userEmailConfirmation = new UserEmailConfirmation();
    userEmailConfirmation.user = user;
    userEmailConfirmation.confirmationCode = confirmationCode;
    userEmailConfirmation.expirationDate = add(new Date(), { hours: 1 });

    await this.usersRepository.queryRunnerSave(userEmailConfirmation, manager);

    await this.sendRegistrationMail(
      user.login,
      user.email,
      confirmationCode,
      user.id,
    );

    return savedUser.id;
  }

  public async execute(command: RegistrationCommand) {
    return super.execute(command);
  }

  private async sendRegistrationMail(
    login: string,
    email: string,
    confirmationCode: string,
    userId: number,
  ): Promise<any> {
    try {
      await this.mailAdapter.sendRegistrationMail(
        login,
        email,
        confirmationCode,
      );
    } catch (e) {
      console.error(e);
      await this.usersRepository.deleteUserSQL(userId);
      return null;
    }
  }
}
