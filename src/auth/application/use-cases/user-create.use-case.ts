import { CommandHandler } from '@nestjs/cqrs';
import { CreateUserDto } from '../../../sa/dto/create-user.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { SaRepository } from '../../../sa/sa.repository';
import { User } from '../../entities/user.entity';
import { TransactionBaseUseCase } from './transaction-base.use-case';
import { UserBanBySA } from '../../entities/user-ban-by-sa.entity';
import { UserBanByBlogger } from '../../entities/user-ban-by-blogger.entity';
import { hash } from 'bcryptjs';

export class UserCreateCommand {
  constructor(public userInputDto: CreateUserDto) {}
}

@CommandHandler(UserCreateCommand)
export class UserCreateUseCase extends TransactionBaseUseCase<
  UserCreateCommand,
  number
> {
  constructor(
    @InjectDataSource()
    protected readonly dataSource: DataSource,
    protected readonly saRepository: SaRepository,
  ) {
    super(dataSource);
  }

  async doLogic(
    command: UserCreateCommand,
    manager: EntityManager,
  ): Promise<number> {
    const user = new User();
    user.login = command.userInputDto.login;
    user.passwordHash = await hash(command.userInputDto.password, 10);
    user.email = command.userInputDto.email;
    user.isConfirmed = true;

    const savedUser = await this.saRepository.queryRunnerSave(user, manager);

    const userBanBySA = new UserBanBySA();
    userBanBySA.user = user;
    userBanBySA.isBanned = false;

    await this.saRepository.queryRunnerSave(userBanBySA, manager);

    const userBanByBlogger = new UserBanByBlogger();
    userBanByBlogger.user = user;
    userBanByBlogger.isBanned = false;

    await this.saRepository.queryRunnerSave(userBanByBlogger, manager);

    return savedUser.id;
  }

  public async execute(command: UserCreateCommand) {
    return super.execute(command);
  }
}
