import { Inject, Injectable } from '@nestjs/common';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogsRepository } from './blogs.repository';

@Injectable()
export class BlogsService {
  constructor(
    @Inject(BlogsRepository)
    protected blogsRepository: BlogsRepository,
  ) {}

  create(createBlogDto: CreateBlogDto) {
    return this.blogsRepository.create(createBlogDto);
  }

  findAll(queryParams) {
    return this.blogsRepository.findAllBlogs(queryParams);
  }

  async findAllPosts(queryParams, id, userId) {
    const checkForBlogId = await this.blogsRepository.findOne(id);
    if (!checkForBlogId) {
      return false;
    }
    return await this.blogsRepository.findAllPosts(
      queryParams,
      checkForBlogId.id,
      userId,
    );
  }

  async createPostByBlogId(createPostDto, blogId) {
    const checkForBlogId = await this.blogsRepository.findOne(blogId);
    if (!checkForBlogId) {
      return false;
    }

    return this.blogsRepository.createPostByBlogId(
      createPostDto,
      blogId,
      checkForBlogId.name,
    );
  }

  findOne(id: string) {
    return this.blogsRepository.findOne(id);
  }

  async updateOne(id: string, updateBlogDto: UpdateBlogDto) {
    return this.blogsRepository.updateOne(id, updateBlogDto);
  }

  remove(id: string) {
    return this.blogsRepository.remove(id);
  }
}
