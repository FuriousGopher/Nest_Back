import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../db/schemas/users.schema';
import { Model, Types } from 'mongoose';
import { UserQueryParamsDto } from './dto/userQueryParams.dto';
import { UsersResponseDto } from './dto/usersResponse.dto';

@Injectable()
export class SaRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findBannedUsersFromArrayOfIds(ids: Types.ObjectId[]) {
    const users = await this.userModel.find({
      'banInfo.isBanned': true,
      _id: { $in: ids },
    });
    return users.map((user) => user._id.toString());
  }

  async saveUser(newUser: UserDocument) {
    return await newUser.save();
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

  async getAllUsers(
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
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) return false;
    const convertedId = new Types.ObjectId(id);
    const user = await this.userModel.findById(convertedId).exec();
    if (!user) {
      return false;
    }
    return user;
  }

  async saveNewUser(newUser: UserDocument) {
    return await newUser.save();
  }

  async checkLogin(login: string) {
    const foundLogin = await this.userModel.findOne({
      'accountData.login': login,
    });
    return !!foundLogin;
  }

  async deleteUser(id: string) {
    return this.userModel.findByIdAndDelete({ _id: id });
  }

  async checkEmail(email: string) {
    return this.userModel.findOne({ 'accountData.email': email });
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

  async banUser(id: string, banStatus: boolean) {
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
  }

  async unBanUser(id: string, banStatus: boolean) {
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
  }
}
