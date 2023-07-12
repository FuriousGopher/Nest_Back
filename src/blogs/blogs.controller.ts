import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  HttpCode,
  Put,
  NotFoundException,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { BlogsQueryParamsDto } from './dto/blogs-query-params.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { PostsQueryParamsDto } from '../posts/dto/posts-query-params.dto';
import { createPostByBlogIdDto } from './dto/create-post-byBlogId.dto';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Post()
  create(@Body() createBlogDto: CreateBlogDto) {
    return this.blogsService.create(createBlogDto);
  }

  @Post(':id/posts')
  async createPost(
    @Body() createPostDto: createPostByBlogIdDto,
    @Param('id') id: string,
  ) {
    const createResult = await this.blogsService.createPostByBlogId(
      createPostDto,
      id,
    );
    if (!createResult) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }
    return createResult;
  }

  @Get()
  findAll(@Query() queryParams: BlogsQueryParamsDto) {
    return this.blogsService.findAll(queryParams);
  }

  @Get(':id/posts')
  async findAllPosts(
    @Query() queryParams: PostsQueryParamsDto,
    @Param('id') id: string,
  ) {
    const getResultAllPosts = await this.blogsService.findAllPosts(
      queryParams,
      id,
    );
    if (!getResultAllPosts) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }
    return getResultAllPosts;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const resultFindOne = await this.blogsService.findOne(id);
    if (!resultFindOne) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }
    return resultFindOne;
  }

  @HttpCode(204)
  @Put(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogDto,
  ) {
    const updatedResult = await this.blogsService.updateOne(id, updateBlogDto);
    if (!updatedResult) {
      throw new NotFoundException(`Blog with id ${id} not found`);
    }
    return updatedResult;
  }

  @HttpCode(204)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogsService.remove(id);
  }
}
