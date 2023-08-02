import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
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
import { PostsService } from '../posts/posts.service';
import { UpdatePostByBloggerDto } from './dto/update-post-by-blogger.dto';
import { BannedUsersQueryParamsDto } from './dto/banned-users-query-params.dto';
import { BanUserDto } from '../sa/dto/ban-user.dto';

@UseGuards(JwtBearerGuard)
@Controller('blogger')
export class BloggerController {
  constructor(
    private readonly bloggerService: BloggerService,
    private readonly blogsService: BlogsService,
    private readonly postsService: PostsService,
  ) {}

  @Get('blogs')
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

  @Get('blogs/:id/posts')
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

  @Post('blogs')
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

  @Post('blogs/:id/posts')
  async createPost(
    @Body() createPostDto: createPostByBlogIdDto,
    @Param('id') id: string,
    @UserIdFromHeaders() userId: string,
  ) {
    const findBlog = await this.blogsService.findOne(id);
    if (!findBlog) {
      return exceptionHandler(
        ResultCode.NotFound,
        'Blog with this id not found',
        'id',
      );
    }
    const checkOwner = await this.blogsService.checkOwner(userId, id);

    if (!checkOwner) {
      return exceptionHandler(
        ResultCode.Forbidden,
        `Blog with ${id} not yours`,
        'id',
      );
    }

    return await this.blogsService.createPostByBlogId(createPostDto, id);
  }

  @HttpCode(204)
  @Put('blogs/:id')
  async updateBlog(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @UserIdFromHeaders() userId: string,
  ) {
    const findBlog = await this.blogsService.findOne(id);

    if (!findBlog) {
      return exceptionHandler(
        ResultCode.NotFound,
        'Blog with this id not found',
        'id',
      );
    }

    const checkOwner = await this.blogsService.checkOwner(userId, id);

    if (!checkOwner) {
      return exceptionHandler(
        ResultCode.Forbidden,
        `Blog with ${id} not yours`,
        'id',
      );
    }

    return await this.blogsService.updateOne(id, updateBlogDto);
  }

  @HttpCode(204)
  @Put('blogs/:blogId/posts/:postId')
  async updatePost(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostByBloggerDto,
    @UserIdFromHeaders() userId: string,
  ) {
    const findPost = await this.postsService.findOne(postId);
    if (!findPost) {
      return exceptionHandler(
        ResultCode.NotFound,
        'Post with this id not found',
        'id',
      );
    }

    const checkBlogId = await this.blogsService.findOne(blogId);

    if (!checkBlogId) {
      return exceptionHandler(
        ResultCode.NotFound,
        'Blog with this id not found',
        'id',
      );
    }

    const checkOwner = await this.blogsService.checkOwner(userId, blogId);

    if (!checkOwner) {
      return exceptionHandler(
        ResultCode.Forbidden,
        `Blog with ${blogId} not yours `,
        'id',
      );
    }

    return await this.postsService.updateOne(postId, updatePostDto);
  }

  @HttpCode(204)
  @Delete('blogs/:id')
  async removeBlogById(
    @Param('id') id: string,
    @UserIdFromHeaders() userId: string,
  ) {
    const findBlog = await this.blogsService.findOne(id);

    if (!findBlog) {
      return exceptionHandler(
        ResultCode.NotFound,
        'Blog with this id not found',
        'id',
      );
    }

    const checkOwner = await this.blogsService.checkOwner(userId, id);

    if (!checkOwner) {
      return exceptionHandler(
        ResultCode.Forbidden,
        `Blog with ${id} not yours`,
        'id',
      );
    }

    return this.blogsService.remove(id);
  }

  @HttpCode(204)
  @Delete('blogs/:blogId/posts/:postId')
  async removePostById(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @UserIdFromHeaders() userId: string,
  ) {
    const findPost = await this.postsService.findOne(postId);

    if (!findPost) {
      return exceptionHandler(
        ResultCode.NotFound,
        'Post with this id not found',
        'id',
      );
    }

    const checkBlogId = await this.blogsService.findOne(blogId);

    if (!checkBlogId) {
      return exceptionHandler(
        ResultCode.NotFound,
        'Blog with this id not found',
        'id',
      );
    }

    const checkOwner = await this.blogsService.checkOwner(userId, blogId);

    if (!checkOwner) {
      return exceptionHandler(
        ResultCode.Forbidden,
        `Post with ${postId} not yours`,
        'id',
      );
    }

    return await this.postsService.remove(postId);
  }

  ////Users

  @Get('users/blog/:id')
  async findAllBannedUsersForBlog(
    @Param('id') id: string,
    @Query() queryParams: BannedUsersQueryParamsDto,
  ) {
    const result = await this.blogsService.findAllBannedUsersForBlog(
      id,
      queryParams,
    );
    if (!result) {
      return exceptionHandler(
        ResultCode.NotFound,
        'Blog with this id not found',
        'id',
      );
    }
    return result;
  }

  @HttpCode(204)
  @Put('users/:userId/ban')
  async changeBanStatusOfUser(
    @Param('userId') userId: string,
    @UserIdFromHeaders() bloggerId: string,
    @Body() banUserDto: BanUserDto,
  ) {
    const findUser = await this.bloggerService.findUser(userId);
    if (!findUser) {
      return exceptionHandler(
        ResultCode.NotFound,
        'User with this id not found',
        'id',
      );
    }

    const result = await this.bloggerService.changeBanStatusOfUser(
      bloggerId,
      banUserDto,
      userId,
    );
    if (!result) {
      return exceptionHandler(
        ResultCode.BadRequest,
        'Something went wrong',
        'userId',
      );
    }
    return result;
  }
}
