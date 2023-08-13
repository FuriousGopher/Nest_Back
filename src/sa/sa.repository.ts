import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserDocument, UserMongo } from '../db/schemas/users.schema';
import { UserQueryParamsDto } from './dto/userQueryParams.dto';
import { UserBanBySA } from '../auth/entities/user-ban-by-sa.entity';
import { UserBanByBlogger } from '../auth/entities/user-ban-by-blogger.entity';
import { UserEmailConfirmation } from '../auth/entities/user-email-confirmation.entity';
import { UserPasswordRecovery } from '../auth/entities/user-password-recovery.entity';
import { Paginator } from '../utils/paginator';
import { BannedUsersQueryParamsDto } from '../blogger/dto/banned-users-query-params.dto';

@Injectable()
export class SaRepository {
  constructor(
    @InjectModel(UserMongo.name) private userModel: Model<UserDocument>,
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(UserEmailConfirmation)
    private userEmailConfirmationsRepository: Repository<UserEmailConfirmation>,
  ) {}

  /*async createUser(createUserDto: CreateUserDto, passwordHash: string) {
    const user = this.usersRepository.create({
      login: createUserDto.login,
      passwordHash: passwordHash,
      email: createUserDto.email,
      isConfirmed: true,
      userBanBySA: {
        isBanned: false,
        banDate: null,
        banReason: null,
      },
    });

    const createdUser = await this.usersRepository.save(user);

    return {
      id: createdUser.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
      banInfo: {
        isBanned: user.userBanBySA.isBanned,
        banDate: user.userBanBySA.banDate,
        banReason: user.userBanBySA.banReason,
      },
    };
  }*/

  async queryRunnerSave(
    entity: User | UserBanBySA | UserBanByBlogger | UserEmailConfirmation,
    queryRunnerManager: EntityManager,
  ): Promise<User | UserBanBySA | UserBanByBlogger | UserEmailConfirmation> {
    return queryRunnerManager.save(entity);
  }

  async findUsersSQL(queryParams: UserQueryParamsDto) {
    const query: UserQueryParamsDto = {
      pageSize: Number(queryParams.pageSize) || 10,
      pageNumber: Number(queryParams.pageNumber) || 1,
      sortBy: queryParams.sortBy ?? 'createdAt',
      sortDirection: queryParams.sortDirection ?? 'DESC',
      searchEmailTerm: queryParams.searchEmailTerm ?? null,
      searchLoginTerm: queryParams.searchLoginTerm ?? null,
      banStatus: queryParams.banStatus ?? 'all',
    };

    const users = await this.usersRepository
      .createQueryBuilder('u')
      .where(
        `${
          query.banStatus === true || query.banStatus === false
            ? 'ubsa.isBanned = :banStatus'
            : 'ubsa.isBanned is not null'
        }`,
        { banStatus: query.banStatus },
      )
      .andWhere(
        `${
          query.searchLoginTerm || query.searchEmailTerm
            ? `(u.login ilike :loginTerm OR u.email ilike :emailTerm)`
            : 'u.login is not null'
        }`,
        {
          loginTerm: `%${query.searchLoginTerm}%`,
          emailTerm: `%${query.searchEmailTerm}%`,
        },
      )
      .leftJoinAndSelect('u.userBanBySA', 'ubsa')
      .orderBy(`u.${query.sortBy}`, query.sortDirection)
      .offset((query.pageNumber - 1) * query.pageSize)
      .limit(query.pageSize)
      .getMany();

    const totalCount = await this.usersRepository
      .createQueryBuilder('u')
      .where(
        `${
          query.banStatus === true || query.banStatus === false
            ? 'ubsa.isBanned = :banStatus'
            : 'ubsa.isBanned is not null'
        }`,
        { banStatus: query.banStatus },
      )
      .andWhere(
        `${
          query.searchLoginTerm || query.searchEmailTerm
            ? `(u.login ilike :loginTerm OR u.email ilike :emailTerm)`
            : 'u.login is not null'
        }`,
        {
          loginTerm: `%${query.searchLoginTerm}%`,
          emailTerm: `%${query.searchEmailTerm}%`,
        },
      )
      .leftJoinAndSelect('u.userBanBySA', 'ubsa')
      .getCount();

    return Paginator.paginate({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      totalCount: totalCount,
      items: await this.usersMapping(users),
    });
  }

  private async usersMapping(array: User[]) {
    return array.map((u) => {
      return {
        id: u.id.toString(),
        login: u.login,
        email: u.email,
        createdAt: u.createdAt,
        banInfo: {
          isBanned: u.userBanBySA.isBanned,
          banDate: u.userBanBySA.banDate,
          banReason: u.userBanBySA.banReason,
        },
      };
    });
  }

  async dataSourceSaveSQL(
    entity:
      | UserBanBySA
      | UserBanByBlogger
      | UserEmailConfirmation
      | UserPasswordRecovery,
  ): Promise<
    | UserBanBySA
    | UserBanByBlogger
    | UserEmailConfirmation
    | UserPasswordRecovery
  > {
    return this.dataSource.manager.save(entity);
  }

  async findUserForBanBySASQL(userId: string): Promise<User | null> {
    try {
      return await this.usersRepository
        .createQueryBuilder('u')
        .where(`u.id = :userId`, { userId: userId })
        .leftJoinAndSelect('u.userBanBySA', 'ubsa')
        .getOne();
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async findBannedUsersFromArrayOfIds(ids: Types.ObjectId[]) {
    const users = await this.userModel.find({
      'banInfo.isBanned': true,
      _id: { $in: ids },
    });
    return users.map((user) => user._id.toString());
  }

  async checkUserBanStatus(id: string) {
    try {
      const user = await this.userModel.findById(id);
      if (!user) return true;
      return !!(user.banInfo.isBanned === false || null);
    } catch (e) {
      console.error('An error occurred while checking ban status:', e);
      return false;
    }
  }

  /*async getAllUsers(
    queryParams: UserQueryParamsDto,
  ): Promise<UsersResponseDto | boolean> {
    try {
      const query: UserQueryParamsDto = {
        pageSize: Number(queryParams.pageSize) || 10,
        pageNumber: Number(queryParams.pageNumber) || 1,
        sortBy: queryParams.sortBy ?? 'createdAt',
        sortDirection: queryParams.sortDirection ?? 'desc',
        searchEmailTerm: queryParams.searchEmailTerm ?? null,
        searchLoginTerm: queryParams.searchLoginTerm ?? null,
        banStatus: queryParams.banStatus ?? 'all',
      };

      const skipCount = (query.pageNumber - 1) * query.pageSize;
      const filter: any = {};

      if (query.banStatus !== 'all') {
        filter['banInfo.isBanned'] = query.banStatus === 'banned';
      }

      if (query.searchLoginTerm || query.searchEmailTerm) {
        filter.$or = [];

        if (query.searchLoginTerm) {
          filter.$or.push({
            'accountData.login': {
              $regex: query.searchLoginTerm,
              $options: 'i',
            },
          });
        }

        if (query.searchEmailTerm) {
          filter.$or.push({
            'accountData.email': {
              $regex: query.searchEmailTerm,
              $options: 'i',
            },
          });
        }
      }

      const totalCount = await this.userModel.countDocuments(filter).exec();
      const totalPages = Math.ceil(totalCount / query.pageSize);

      const sortKey = `accountData.${query.sortBy}`;

      const users = await this.userModel
        .find(filter)
        .sort({
          [sortKey]: query.sortDirection === 'desc' ? -1 : 1,
        })
        .skip(skipCount)
        .limit(query.pageSize)
        .exec();

      const userViewModels = users.map((user) => ({
        id: user._id.toString(),
        login: user.accountData.login,
        email: user.accountData.email,
        createdAt: user.accountData.createdAt,
        banInfo: {
          isBanned: user.banInfo.isBanned,
          banDate: user.banInfo.banDate,
          banReason: user.banInfo.banReason,
        },
      }));

      return {
        pagesCount: totalPages,
        page: query.pageNumber,
        pageSize: query.pageSize,
        totalCount: totalCount,
        items: userViewModels,
      };
    } catch (error) {
      console.error('An error occurred while getting all users', error);
      return false;
    }
  }*/

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) return false;
    const convertedId = new Types.ObjectId(id);
    const user = await this.userModel.findById(convertedId).exec();
    if (!user) {
      return false;
    }
    return user;
  }

  async findUserByIdSQL(userId: number): Promise<User | null> {
    try {
      return await this.usersRepository
        .createQueryBuilder('u')
        .where(`u.id = :userId`, { userId: userId })
        .getOne();
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async deleteUserSQL(userId: number): Promise<boolean> {
    const result = await this.usersRepository
      .createQueryBuilder('u')
      .delete()
      .from(User)
      .where('id = :userId', { userId: userId })
      .execute();
    return result.affected === 1;
  }

  async saveNewUser(newUser: UserDocument) {
    return await newUser.save();
  }

  async checkLogin(login: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('u')
      .where(`u.login = :login`, { login: login })
      .getOne();
  }

  /*async deleteUser(id: string) {
    return this.userModel.findByIdAndDelete({ _id: id });
  }*/

  async checkEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('u')
      .where(`u.email = :email`, { email: email })
      .getOne();
  }

  async findByConfirmationCode(confirmationCode: string) {
    return this.userModel.findOne({
      'emailConfirmation.confirmationCode': confirmationCode,
    });
  }

  async confirmationOfEmail(confirmationCode: string) {
    try {
      const user = await this.findByConfirmationCode(confirmationCode);
      user!.emailConfirmation.isConfirmed = true;
      await user?.save();
      return true;
    } catch (e) {
      console.error('An error occurred while confirming email:', e);
      return false;
    }
  }

  async updateEmailConfirmationData(
    id: string,
    newConfirmationCode: string,
    newExpirationDate: string,
  ) {
    try {
      const user = await this.findOne(id);
      if (!user) return false;
      user.emailConfirmation.confirmationCode = newConfirmationCode;
      user.emailConfirmation.expirationDate = newExpirationDate;
      user.emailConfirmation.isConfirmed = false;
      await user.save();
      return true;
    } catch (e) {
      console.error(
        'An error occurred while updating email confirmation data:',
        e,
      );
      return false;
    }
  }

  async updatePassword(id: string, passwordHash: string) {
    try {
      const user = await this.userModel.findById({ _id: id });
      user!.accountData.passwordHash = passwordHash;
      user!.emailConfirmation.isConfirmed = true;
      await user?.save();
      return true;
    } catch (e) {
      console.error('An error occurred while updating password:', e);
      return false;
    }
  }

  async findByLoginOrEmail(loginOrEmail: string) {
    return this.userModel.findOne({
      $or: [
        { 'accountData.login': loginOrEmail },
        { 'accountData.email': loginOrEmail },
      ],
    });
  }

  /* async banUser(id: string, banStatus: boolean) {
    try {
      const result = await this.userModel.findByIdAndUpdate(
        { _id: id },
        {
          'banInfo.isBanned': banStatus,
          'banInfo.banDate': new Date().toISOString(),
        },
      );
      return result;
    } catch (e) {
      console.error('An error occurred while unbanning user:', e);
      return false;
    }
  }*/

  /*async unBanUser(id: string, banStatus: boolean) {
    try {
      return await this.userModel.findByIdAndUpdate(
        { _id: id },
        {
          'banInfo.isBanned': banStatus,
          'banInfo.banDate': null,
          'banInfo.banReason': null,
        },
      );
    } catch (e) {
      console.error('An error occurred while unbanning user:', e);
      return false;
    }
  }*/

  async findUserByIdMappedSQL(userId: number) {
    const users = await this.usersRepository
      .createQueryBuilder('u')
      .where(`u.id = :userId`, {
        userId: userId,
      })
      .leftJoinAndSelect('u.userBanBySA', 'ubsa')
      .getMany();

    const mappedUsers = await this.usersMapping(users);
    return mappedUsers[0];
  }

  async findUserForEmailConfirmSQL(
    confirmationCode: string,
  ): Promise<User | null> {
    try {
      return await this.usersRepository
        .createQueryBuilder('u')
        .where(`uec.confirmationCode = :confirmationCode`, {
          confirmationCode: confirmationCode,
        })
        .leftJoinAndSelect('u.userEmailConfirmation', 'uec')
        .getOne();
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async deleteEmailConfirmationForUser(userId: number): Promise<boolean> {
    const result = await this.userEmailConfirmationsRepository
      .createQueryBuilder('uec')
      .delete()
      .from(UserEmailConfirmation)
      .where('userId = :userId', { userId: userId })
      .execute();
    return result.affected === 1;
  }

  async findUserForEmailResendSQL(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('u')
      .where(`u.email = :email`, {
        email: email,
      })
      .leftJoinAndSelect('u.userEmailConfirmation', 'uec')
      .getOne();
  }

  async findUserByLoginOrEmail(loginOrEmail: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('u')
      .where(`u.login = :loginOrEmail OR u.email = :loginOrEmail`, {
        loginOrEmail: loginOrEmail,
      })
      .leftJoinAndSelect('u.userBanBySA', 'ubsa')
      .getOne();
  }

  async findUsersBannedByBlogger(
    query: BannedUsersQueryParamsDto,
    blogId: number,
  ) {
    const users = await this.usersRepository
      .createQueryBuilder('u')
      .where(`${query.searchLoginTerm ? 'u.login ilike :loginTerm' : ''}`, {
        loginTerm: `%${query.searchLoginTerm}%`,
      })
      .andWhere(`ubb.isBanned = true`)
      .andWhere(`b.id = :blogId`, {
        blogId: blogId,
      })
      .leftJoinAndSelect('u.userBanByBlogger', 'ubb')
      .leftJoinAndSelect('ubb.blog', 'b')
      .orderBy(`u.${query.sortBy}`, query.sortDirection)
      .skip((query.pageNumber - 1) * query.pageSize)
      .take(query.pageSize)
      .getMany();

    const totalCount = await this.usersRepository
      .createQueryBuilder('u')
      .where(`${query.searchLoginTerm ? 'u.login ilike :loginTerm' : ''}`, {
        loginTerm: `%${query.searchLoginTerm}%`,
      })
      .andWhere(`ubb.isBanned = true`)
      .andWhere(`b.id = :blogId`, {
        blogId: blogId,
      })
      .leftJoinAndSelect('u.userBanByBlogger', 'ubb')
      .leftJoinAndSelect('ubb.blog', 'b')
      .getCount();

    return Paginator.paginate({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      totalCount: totalCount,
      items: await this.usersBannedByBloggerMapping(users),
    });
  }

  private async usersBannedByBloggerMapping(array: User[]) {
    return array.map((u) => {
      return {
        id: u.id.toString(),
        login: u.login,
        banInfo: {
          isBanned: u.userBanByBlogger!.isBanned,
          banDate: u.userBanByBlogger!.banDate,
          banReason: u.userBanByBlogger!.banReason,
        },
      };
    });
  }

  async findUserForBanByBlogger(userId: string | number) {
    try {
      return await this.usersRepository
        .createQueryBuilder('u')
        .where(`u.id = :userId`, { userId: userId })
        .leftJoinAndSelect('u.userBanByBlogger', 'ubb')
        .getOne();
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
