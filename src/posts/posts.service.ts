import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsRepository } from './posts.repository';
import { BlogsRepository } from '../blogs/blogs.repository';

@Injectable()
export class PostsService {
  constructor(
    @Inject(PostsRepository)
    protected postsRepository: PostsRepository,
    @Inject(BlogsRepository)
    protected blogsRepository: BlogsRepository,
  ) {}

  async create(createPostDto: CreatePostDto) {
    const blogName = await this.blogsRepository.findOne(createPostDto.blogId);
    if (!blogName) {
      throw new NotFoundException('Blog not found');
    }
    return this.postsRepository.create(createPostDto, blogName.name);
  }

  async findAll(queryParams) {
    return await this.postsRepository.findAllPosts(queryParams);
  }

  findOne(id: string) {
    return this.postsRepository.findOne(id);
  }

  updateOne(id: string, updatePostDto: UpdatePostDto) {
    return this.postsRepository.updateOne(id, updatePostDto);
  }

  remove(id: string) {
    return this.postsRepository.remove(id);
  }
}
