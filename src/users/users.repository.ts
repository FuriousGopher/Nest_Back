import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../db/schemas/users.schema';
import { Model } from 'mongoose';
import { UserQueryParamsDto } from './dto/userQueryParams.dto';
import { UsersResponseDto } from './dto/usersResponse.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createUserBySA(createUserDto: CreateUserDto, passwordHash) {
    try {
      const newUser = new this.userModel({
        accountData: {
          login: createUserDto.login,
          email: createUserDto.email,
          passwordHash: passwordHash,
        },
        emailConfirmation: {
          isConfirmed: true,
        },
      });

      await newUser.save();

      return {
        id: newUser._id.toString(),
        login: newUser.accountData.login,
        email: newUser.accountData.email,
        createdAt: newUser.accountData.createdAt.toISOString(),
      };
    } catch (e) {
      console.error(
        `An error occurred while creating a user ${createUserDto.login} in repo`,
        e,
      );
      return false;
    }
  }

  async getAllUsers(
    queryParams: UserQueryParamsDto,
  ): Promise<UsersResponseDto | boolean> {
    try {
      const query = {
        pageSize: Number(queryParams.pageSize) || 10,
        pageNumber: Number(queryParams.pageNumber) || 1,
        sortBy: queryParams.sortBy ?? 'createdAt',
        sortDirection: queryParams.sortDirection ?? 'desc',
        searchEmailTerm: queryParams.searchEmailTerm ?? null,
        searchLoginTerm: queryParams.searchLoginTerm ?? null,
      };

      const skipCount = (query.pageNumber - 1) * query.pageSize;
      const filter: any = {};

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
        createdAt: user.accountData.createdAt.toISOString(),
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
    const user = await this.userModel.findById({ _id: id });
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
    newExpirationDate: Date,
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
}
