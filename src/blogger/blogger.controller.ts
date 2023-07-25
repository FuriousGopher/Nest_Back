import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
} from '@nestjs/common';
import { BloggerService } from './blogger.service';
import { CreateBloggerDto } from './dto/create-blogger.dto';
import { UpdateBloggerDto } from './dto/update-blogger.dto';
import { JwtBearerGuard } from '../auth/guards/jwt-bearer.guard';
import { UserIdFromHeaders } from '../decorators/user-id-from-headers.decorator';
import { BlogsQueryParamsDto } from '../blogs/dto/blogs-query-params.dto';
import { exceptionHandler } from '../exceptions/exception.handler';
import { ResultCode } from '../enums/result-code.enum';
import { PostsQueryParamsDto } from '../posts/dto/posts-query-params.dto';
import { BlogsService } from '../blogs/blogs.service';

@UseGuards(JwtBearerGuard)
@Controller('blogger/blogs')
export class BloggerController {
  constructor(
    private readonly bloggerService: BloggerService,
    private readonly blogsService: BlogsService,
  ) {}

  @Get()
  async findAll(
    @UserIdFromHeaders() userId: string,
    @Query() queryParams: BlogsQueryParamsDto,
  ) {
    const result = this.bloggerService.findAll(queryParams, userId);

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

  @Post()
  create(@Body() createBloggerDto: CreateBloggerDto) {
    return this.bloggerService.create(createBloggerDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBloggerDto: UpdateBloggerDto) {
    return this.bloggerService.update(+id, updateBloggerDto);
  }

  /*@HttpCode(204)
  @Delete(':id')
  async remove(@Param('id') id: string, @UserIdFromHeaders() userId: string) {
    const checkOwner = await this.bloggerService.checkOwner(userId, id);
    if (!checkOwner) {
      return exceptionHandler(
        ResultCode.Forbidden,
        `Comment with ${id} not yours`,
        'id',
      );
    }
    const result = this.bloggerService.remove(+id);
    if (!result) {
      return exceptionHandler(
        ResultCode.NotFound,
        `Comment with ${id} not found`,
        'id',
      );
    }
    return result;
  }*/
}
