import { Inject, Injectable } from '@nestjs/common';
import { BlogsQueryParamsDto } from '../blogs/dto/blogs-query-params.dto';
import { BlogsRepository } from '../blogs/blogs.repository';
import { CreateBlogDto } from '../blogs/dto/create-blog.dto';
import { SaRepository } from '../sa/sa.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlogMongo, BlogDocument } from '../db/schemas/blogs.schema';
import { BanUserDto } from '../sa/dto/ban-user.dto';
import { PostsQueryParamsDto } from '../posts/dto/posts-query-params.dto';
import { PostsRepository } from '../posts/posts.repository';
import { BanUserForBlogDto } from '../sa/dto/ban-user-for-blog.dto';

@Injectable()
export class BloggerService {
  constructor(
    @Inject(BlogsRepository)
    protected blogsRepository: BlogsRepository,
    protected saRepository: SaRepository,
    protected postsRepository: PostsRepository,

    @InjectModel(BlogMongo.name) private blogModel: Model<BlogDocument>,
  ) {}
  async create(createBlogDto: CreateBlogDto, userId: string) {
    const findUser = await this.saRepository.findOne(userId);
    if (!findUser) return false;

    const newBlog = new this.blogModel({
      name: createBlogDto.name,
      description: createBlogDto.description,
      websiteUrl: createBlogDto.websiteUrl,
      blogOwnerInfo: {
        userId: userId,
        userLogin: findUser.accountData.login,
      },
      isMembership: true,
    });

    await this.blogsRepository.save(newBlog);

    return {
      id: newBlog._id,
      name: newBlog.name,
      description: newBlog.description,
      websiteUrl: newBlog.websiteUrl,
      createdAt: newBlog.createdAt,
      isMembership: newBlog.isMembership,
    };
  }

  findAll(queryParams: BlogsQueryParamsDto, userId: string) {
    return this.blogsRepository.findAllOwenBlogs(queryParams, +userId);
  }

  async findUser(userId: string) {
    return await this.saRepository.findOne(userId);
  }

  async changeBanStatusOfUser(banUserDto: BanUserForBlogDto, userId: string) {
    if (banUserDto.isBanned) {
      return await this.blogsRepository.banUserForBlogs(banUserDto, userId);
    }

    if (!banUserDto.isBanned) {
      return await this.blogsRepository.unBanUserForBlogs(userId, banUserDto);
    }
  }

  async checkOwnerShip(userId: string, blogId: string) {
    return this.blogsRepository.checkOwnerShip(userId, blogId);
  }
}
