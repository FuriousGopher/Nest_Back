import { Injectable } from '@nestjs/common';
import { CreateBloggerDto } from './dto/create-blogger.dto';
import { UpdateBloggerDto } from './dto/update-blogger.dto';
import { BlogsQueryParamsDto } from '../blogs/dto/blogs-query-params.dto';

@Injectable()
export class BloggerService {
  create(createBloggerDto: CreateBloggerDto) {
    return 'This action adds a new blogger';
  }

  findAll(queryParams: BlogsQueryParamsDto, userId: string) {
    return `This action returns all blogger`;
  }

  findOne(id: number) {
    return `This action returns a #${id} blogger`;
  }

  update(id: number, updateBloggerDto: UpdateBloggerDto) {
    return `This action updates a #${id} blogger`;
  }

  remove(id: number) {
    return `This action removes a #${id} blogger`;
  }
}
