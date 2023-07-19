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
  UseGuards,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { BlogsQueryParamsDto } from './dto/blogs-query-params.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { PostsQueryParamsDto } from '../posts/dto/posts-query-params.dto';
import { createPostByBlogIdDto } from './dto/create-post-byBlogId.dto';
import { exceptionHandler } from '../exceptions/exception.handler';
import { ResultCode } from '../enums/result-code.enum';
import { BasicAuthGuard } from '../auth/guards/basic-auth.guard';
import { UserIdFromHeaders } from '../decorators/user-id-from-headers.decorator';
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @UseGuards(BasicAuthGuard)
  @Post()
  async create(@Body() createBlogDto: CreateBlogDto) {
    const result = await this.blogsService.create(createBlogDto);
    if (!result) {
      return exceptionHandler(
        ResultCode.BadRequest,
        'Blog not created',
        'name',
      );
    }
    return result;
  }

  @UseGuards(BasicAuthGuard)
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
  async findAll(@Query() queryParams: BlogsQueryParamsDto) {
    const result = await this.blogsService.findAll(queryParams);
    if (!result) {
      return exceptionHandler(ResultCode.NotFound, 'Blogs not found', 'id');
    }

    return result;
  }

  @Get(':id/posts')
  async findAllPosts(
    @Query() queryParams: PostsQueryParamsDto,
    @Param('id') id: string,
    @UserIdFromHeaders() userId,
  ) {
    const getResultAllPosts = await this.blogsService.findAllPosts(
      queryParams,
      id,
      userId,
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

  @UseGuards(BasicAuthGuard)
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

  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.blogsService.remove(id);
    if (!result) {
      return exceptionHandler(
        ResultCode.BadRequest,
        'Blog with this id not found',
        'id',
      );
    }
  }
}
