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

  findOne(id: string) {
    return this.blogsRepository.findOne(id);
  }

  updateOne(id: string, updateBlogDto: UpdateBlogDto) {
    return this.blogsRepository.updateOne(id, updateBlogDto);
  }

  remove(id: string) {
    return this.blogsRepository.remove(id);
  }
}
