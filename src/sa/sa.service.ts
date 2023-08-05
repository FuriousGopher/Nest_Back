import { Injectable } from '@nestjs/common';
import { SaRepository } from './sa.repository';
import { genSalt, hash } from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { UserMongo, UserDocument } from '../db/schemas/users.schema';
import { Model } from 'mongoose';
import { BanUserDto } from './dto/ban-user.dto';
import { BlogsRepository } from '../blogs/blogs.repository';
import { BlogsQueryParamsDto } from '../blogs/dto/blogs-query-params.dto';
import { UserQueryParamsDto } from './dto/userQueryParams.dto';

@Injectable()
export class SaService {
  constructor(
    protected saRepository: SaRepository,
    protected blogsRepository: BlogsRepository,
    @InjectModel(UserMongo.name) private userModel: Model<UserDocument>,
  ) {}

  getAllUsers(queryParams: UserQueryParamsDto) {
    return this.saRepository.findUsersSQL(queryParams);
  }

  async createUser(createUserDto: CreateUserDto) {
    try {
      const passwordSalt = await genSalt(10);

      const passwordHash = await hash(createUserDto.password, passwordSalt);

      return await this.saRepository.createUser(createUserDto, passwordHash);
    } catch (error) {
      console.error('Error', error);

      return false;
    }
  }

  async deleteUser(id: string) {
    const user = await this.saRepository.findUserByIdSQL(+id);
    if (user) {
      return await this.saRepository.deleteUserSQL(+id);
    }
    return false;
  }

  async unBunUser(id: string, banUserDto: BanUserDto) {
    const banStatus = banUserDto.isBanned;
    const banReason = banUserDto.banReason;

    const user = await this.saRepository.findUserForBanBySASQL(id);
    if (!user) {
      return false;
    }

    if (banStatus) {
      user.userBanBySA.isBanned = true;
      user.userBanBySA.banReason = banReason;
      user.userBanBySA.banDate = new Date();
      await this.saRepository.dataSourceSaveSQL(user.userBanBySA);
      return true;
    }

    if (!banStatus) {
      user.userBanBySA.isBanned = false;
      user.userBanBySA.banReason = null;
      user.userBanBySA.banDate = null;
      await this.saRepository.dataSourceSaveSQL(user.userBanBySA);
      return true;
    }
  }

  async bindBlog(id: string, userId: string) {
    const blog = await this.blogsRepository.findBlog(id);
    if (!blog) return false;

    if (blog.blogOwnerInfo.userId.length > 0) {
      return false;
    }
    const user = await this.saRepository.findOne(userId);

    if (!user) return false;

    return await this.blogsRepository.bindBlog(
      id,
      user._id.toString(),
      user.accountData.login,
    );
  }

  async findAllBlogsForSA(queryParams: BlogsQueryParamsDto) {
    return await this.blogsRepository.findAllBlogsForSA(queryParams);
  }

  async banBlog(id: string, banUserDto: BanUserDto) {
    const banStatus = banUserDto.isBanned;

    const checkBlog = await this.blogsRepository.findBlog(id);
    if (!checkBlog) return false;

    if (banStatus) {
      return this.blogsRepository.banBlog(id, banStatus);
    }

    if (!banStatus) {
      return await this.blogsRepository.unBanBlog(id, banStatus);
    }
    return false;
  }
}
