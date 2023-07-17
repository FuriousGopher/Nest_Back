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
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { BlogsQueryParamsDto } from './dto/blogs-query-params.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { PostsQueryParamsDto } from '../posts/dto/posts-query-params.dto';
import { createPostByBlogIdDto } from './dto/create-post-byBlogId.dto';
import { exceptionHandler } from '../exceptions/exception.handler';
import { ResultCode } from '../enums/result-code.enum';
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
      return exceptionHandler(
        ResultCode.BadRequest,
        'Blog with this id not found',
        'id',
      );
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
      return exceptionHandler(
        ResultCode.NotFound,
        'Blog with this id not found',
        'id',
      );
    }
    return getResultAllPosts;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const resultFindOne = await this.blogsService.findOne(id);
    if (!resultFindOne) {
      return exceptionHandler(
        ResultCode.NotFound,
        'Blog with this id not found',
        'id',
      );
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
      return exceptionHandler(
        ResultCode.BadRequest,
        'Blog with this id not found',
        'id',
      );
    }
    return updatedResult;
  }

  @HttpCode(204)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogsService.remove(id);
  }
}
