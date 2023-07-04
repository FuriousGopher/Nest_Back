import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../db/schemas/users.schema';
import { Model } from 'mongoose';
import { UserQueryParamsDto } from './dto/userQueryParams.dto';
import { UsersResponseDto } from './dto/usersResponse.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createUser(createUserDto: CreateUserDto, passwordHash) {
    try {
      const newUser = new this.userModel({
        accountData: {
          login: createUserDto.login,
          email: createUserDto.email,
          passwordHash: passwordHash,
          isMembership: false,
        },
        emailConfirmation: {
          confirmationCode: null,
          expirationDate: null,
          isConfirmed: false,
        },
      });

      const createdUser = await newUser.save();

      return {
        id: createdUser._id,
        login: createdUser.accountData.login,
        email: createdUser.accountData.email,
        createdAt: createdUser.accountData.createdAt,
      };
    } catch (e) {
      console.error('An error occurred while creating a user:', e);

      return {
        success: false,
        message: 'An error occurred while creating a user.',
      };
    }
  }

  async getAllUsers(
    queryParams: UserQueryParamsDto,
  ): Promise<UsersResponseDto | { message: string } | { success: boolean }> {
    try {
      const {
        sortBy = 'createdAt',
        sortDirection = 'desc',
        pageNumber = 1,
        pageSize = 10,
        searchLoginTerm = null,
        searchEmailTerm = null,
      } = queryParams;

      const skipCount = (pageNumber - 1) * pageSize;
      const filter: any = {};

      if (searchLoginTerm) {
        filter['accountData.login'] = {
          $regex: searchLoginTerm,
          $options: 'i',
        };
      }

      if (searchEmailTerm) {
        filter['accountData.email'] = {
          $regex: searchEmailTerm,
          $options: 'i',
        };
      }

      const totalCount = await this.userModel.countDocuments(filter).exec();
      const totalPages = Math.ceil(totalCount / pageSize);

      const users = await this.userModel
        .find(filter)
        .sort({ [sortBy]: sortDirection === 'desc' ? -1 : 1 })
        .skip(skipCount)
        .limit(pageSize)
        .exec();

      const userViewModels = users.map((user) => ({
        id: user._id.toString(),
        login: user.accountData.login,
        email: user.accountData.email,
        createdAt: user.accountData.createdAt,
      }));

      const usersResponse: UsersResponseDto = {
        pagesCount: totalPages,
        page: pageNumber,
        pageSize: pageSize,
        totalCount: totalCount,
        items: userViewModels,
      };

      return usersResponse;
    } catch (e) {
      console.error('An error occurred while getting all users', e);

      return {
        success: false,
        message: 'An error occurred while getting all users.',
      };
    }
  }

  async deleteUser(id: string) {
    const userExists = await this.userModel.exists({ _id: id });
    if (!userExists) {
      throw new NotFoundException('User not found');
    }
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();
    return deletedUser;
  }
}
