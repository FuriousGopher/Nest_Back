import { Inject, Injectable } from '@nestjs/common';
import { CreateBloggerDto } from './dto/create-blogger.dto';
import { UpdateBloggerDto } from './dto/update-blogger.dto';
import { BlogsQueryParamsDto } from '../blogs/dto/blogs-query-params.dto';
import { BlogsRepository } from '../blogs/blogs.repository';
import { CreateBlogDto } from '../blogs/dto/create-blog.dto';
import { SaRepository } from '../sa/sa.repository';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../db/schemas/users.schema';
import { Model } from 'mongoose';
import { Blog, BlogDocument } from '../db/schemas/blogs.schema';

@Injectable()
export class BloggerService {
  constructor(
    @Inject(BlogsRepository)
    protected blogsRepository: BlogsRepository,
    protected usersRepository: SaRepository,

    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
  ) {}
  async create(createBlogDto: CreateBlogDto, userId: string) {
    const findUser = await this.usersRepository.findOne(userId);
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
    return this.blogsRepository.findAllOwenBlogs(queryParams, userId);
  }
}
