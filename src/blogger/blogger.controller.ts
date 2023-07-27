import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  HttpCode,
  Put,
  Delete,
} from '@nestjs/common';
import { BloggerService } from './blogger.service';
import { JwtBearerGuard } from '../auth/guards/jwt-bearer.guard';
import { UserIdFromHeaders } from '../decorators/user-id-from-headers.decorator';
import { BlogsQueryParamsDto } from '../blogs/dto/blogs-query-params.dto';
import { exceptionHandler } from '../exceptions/exception.handler';
import { ResultCode } from '../enums/result-code.enum';
import { PostsQueryParamsDto } from '../posts/dto/posts-query-params.dto';
import { BlogsService } from '../blogs/blogs.service';
import { CreateBlogDto } from '../blogs/dto/create-blog.dto';
import { createPostByBlogIdDto } from '../blogs/dto/create-post-byBlogId.dto';
import { UpdateBlogDto } from '../blogs/dto/update-blog.dto';
import { UpdatePostDto } from '../posts/dto/update-post.dto';
import { PostsService } from '../posts/posts.service';

@UseGuards(JwtBearerGuard)
@Controller('blogger/blogs')
export class BloggerController {
  constructor(
    private readonly bloggerService: BloggerService,
    private readonly blogsService: BlogsService,
    private readonly postsService: PostsService,
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
    @UserIdFromHeaders() userId: any,
  ) {
    const checkOwner = await this.blogsService.checkOwner(userId, id);
    if (!checkOwner) {
      return exceptionHandler(
        ResultCode.Forbidden,
        `Blog with ${id} not yours`,
        'id',
      );
    }

    const getResultAllPosts = await this.blogsService.findAllPostsForBlogger(
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
  async create(
    @Body() createBlogDto: CreateBlogDto,
    @UserIdFromHeaders() userId: string,
  ) {
    const result = await this.bloggerService.create(createBlogDto, userId);
    if (!result) {
      return exceptionHandler(
        ResultCode.BadRequest,
        'Blog not created',
        'name',
      );
    }
    return result;
  }

  @Post(':id/posts')
  async createPost(
    @Body() createPostDto: createPostByBlogIdDto,
    @Param('id') id: string,
    @UserIdFromHeaders() userId: string,
  ) {
    const checkOwner = await this.blogsService.checkOwner(userId, id);

    if (!checkOwner) {
      return exceptionHandler(
        ResultCode.Forbidden,
        `Blog with ${id} not yours`,
        'id',
      );
    }

    const createResult = await this.blogsService.createPostByBlogId(
      createPostDto,
      id,
    );

    if (!createResult) {
      return exceptionHandler(
        ResultCode.NotFound,
        'Blog with this id not found',
        'id',
      );
    }
    return createResult;
  }

  @HttpCode(204)
  @Put(':id')
  async updateBlog(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @UserIdFromHeaders() userId: string,
  ) {
    const checkOwner = await this.blogsService.checkOwner(userId, id);

    if (!checkOwner) {
      return exceptionHandler(
        ResultCode.Forbidden,
        `Blog with ${id} not yours`,
        'id',
      );
    }

    const updatedResult = await this.blogsService.updateOne(id, updateBlogDto);
    if (!updatedResult) {
      return exceptionHandler(
        ResultCode.NotFound,
        'Blog with this id not found',
        'id',
      );
    }
    return updatedResult;
  }

  @HttpCode(204)
  @Put(':blogId/posts/:postId')
  async updatePost(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
    @UserIdFromHeaders() userId: string,
  ) {
    const checkOwner = await this.blogsService.checkOwner(userId, blogId);

    if (!checkOwner) {
      return exceptionHandler(
        ResultCode.Forbidden,
        `Blog with ${blogId} not yours`,
        'id',
      );
    }

    const result = await this.postsService.updateOne(postId, updatePostDto);
    if (!result) {
      return exceptionHandler(
        ResultCode.NotFound,
        `Post with this ${postId} not found`,
        'id',
      );
    }
    return result;
  }

  @HttpCode(204)
  @Delete(':id')
  async removeBlogById(
    @Param('id') id: string,
    @UserIdFromHeaders() userId: string,
  ) {
    const checkOwner = await this.blogsService.checkOwner(userId, id);

    if (!checkOwner) {
      return exceptionHandler(
        ResultCode.Forbidden,
        `Blog with ${id} not yours`,
        'id',
      );
    }

    const result = this.blogsService.remove(id);

    if (!result) {
      return exceptionHandler(
        ResultCode.NotFound,
        `Comment with ${id} not found`,
        'id',
      );
    }
    return result;
  }

  @HttpCode(204)
  @Delete(':blogId/posts/:postId')
  async removePostById(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @UserIdFromHeaders() userId: string,
  ) {
    const checkOwner = await this.blogsService.checkOwner(userId, blogId);

    if (!checkOwner) {
      return exceptionHandler(
        ResultCode.Forbidden,
        `Post with ${postId} not yours`,
        'id',
      );
    }

    const result = await this.postsService.remove(postId);
    if (!result) {
      return exceptionHandler(
        ResultCode.NotFound,
        `Post with this ${postId} not found`,
        'id',
      );
    }
    return result;
  }
}
