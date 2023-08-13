import { Inject, Injectable } from '@nestjs/common';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogsRepository } from './blogs.repository';
import { PostsQueryParamsDto } from 'src/posts/dto/posts-query-params.dto';
import { BlogsQueryParamsDto } from './dto/blogs-query-params.dto';
import { createPostByBlogIdDto } from './dto/create-post-byBlogId.dto';
import { BannedUsersQueryParamsDto } from '../blogger/dto/banned-users-query-params.dto';

@Injectable()
export class BlogsService {
  constructor(
    @Inject(BlogsRepository)
    protected blogsRepository: BlogsRepository,
  ) {}

  create(createBlogDto: CreateBlogDto) {
    return this.blogsRepository.create(createBlogDto);
  }

  findAll(queryParams: BlogsQueryParamsDto) {
    return this.blogsRepository.findAllBlogsSQl(queryParams);
  }

  async findAllPosts(
    queryParams: PostsQueryParamsDto,
    id: string,
    userId: string,
  ) {
    const checkForBlogId = await this.blogsRepository.findByIdSQL(id);
    if (!checkForBlogId) {
      return false;
    }
    return await this.blogsRepository.findAllPosts(
      queryParams,
      checkForBlogId.id,
      userId,
    );
  }

  async findAllPostsForBlogger(
    queryParams: PostsQueryParamsDto,
    id: string,
    userId: string,
  ) {
    const checkForBlogId = await this.blogsRepository.findByIdSQL(id);

    if (!checkForBlogId) {
      return false;
    }

    return await this.blogsRepository.findAllPosts(
      queryParams,
      checkForBlogId.id,
      userId,
    );
  }

  async createPostByBlogId(
    createPostDto: createPostByBlogIdDto,
    blogId: string,
  ) {
    const checkForBlogId = await this.blogsRepository.findByIdSQL(blogId);
    if (!checkForBlogId) {
      return false;
    }

    return this.blogsRepository.createPostByBlogId(
      createPostDto,
      blogId,
      checkForBlogId.name,
    );
  }

  findById(id: string) {
    return this.blogsRepository.findByIdSQL(id);
  }

  async updateOne(id: string, updateBlogDto: UpdateBlogDto) {
    return this.blogsRepository.updateOne(id, updateBlogDto);
  }

  remove(id: string) {
    return this.blogsRepository.remove(id);
  }

  async findOne(blogId: string) {
    return this.blogsRepository.findOne(blogId);
  }

  async checkOwner(userId: string, blogId: string) {
    const findBlog = await this.blogsRepository.findOne(blogId);
    if (!findBlog) {
      return false;
    }
    return findBlog.blogOwnerInfo.userId === userId;
  }
}
