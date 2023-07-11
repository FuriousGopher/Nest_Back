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

      if (query.searchLoginTerm) {
        filter['accountData.login'] = {
          $regex: query.searchLoginTerm,
          $options: 'i',
        };
      }

      if (query.searchEmailTerm) {
        filter['accountData.email'] = {
          $regex: query.searchEmailTerm,
          $options: 'i',
        };
      }

      const totalCount = await this.userModel.countDocuments(filter).exec();
      const totalPages = Math.ceil(totalCount / query.pageSize);

      const users = await this.userModel
        .find(filter)
        .sort({ [query.sortBy]: query.sortDirection === 'desc' ? -1 : 1 })
        .skip(skipCount)
        .limit(query.pageSize)
        .exec();

      const userViewModels = users.map((user) => ({
        id: user._id.toString(),
        login: user.accountData.login,
        email: user.accountData.email,
        createdAt: user.accountData.createdAt,
      }));

      return {
        pagesCount: totalPages,
        page: query.pageNumber,
        pageSize: query.pageSize,
        totalCount: totalCount,
        items: userViewModels,
      };
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
    await this.userModel.findByIdAndDelete(id).exec();
  }
}
