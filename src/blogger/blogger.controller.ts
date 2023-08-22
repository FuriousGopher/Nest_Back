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
import { BanUserForBlogDto } from '../sa/dto/ban-user-for-blog.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { BlogCreateCommand } from './use-cases/blog-create.use-case';
import { BlogUpdateCommand } from './use-cases/blog-update.use-case';
import { BlogDeleteCommand } from './use-cases/blog-delete.use-case';
import { PostCreateCommand } from './use-cases/post-create.use-case';
import { PostUpdateCommand } from './use-cases/post-update.use-case';
import { PostDeleteCommand } from './use-cases/post-delete.use-case';
import { CommentRepository } from '../comments/comment.repository';
import { UsersGetBannedQuery } from './use-cases/users-get-banned.use-case';
import { BloggerBanUserCommand } from './use-cases/user-ban.use-case';

@UseGuards(JwtBearerGuard)
@Controller('blogger')
export class BloggerController {
  constructor(
    private readonly bloggerService: BloggerService,
    private readonly blogsService: BlogsService,
    private readonly postsService: PostsService,
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    private readonly commentRepository: CommentRepository,
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

  @Get('blogs/comments')
  async findAllComments(
    @Query() queryParams: PostsQueryParamsDto,
    @UserIdFromHeaders() userId,
  ) {
    const result = await this.commentRepository.findAllCommentsSQL(
      queryParams,
      userId,
    );
    if (!result) {
      return exceptionHandler(ResultCode.NotFound, 'Comments not found', 'id');
    }
    return result;
  }

  @Post('blogs')
  async create(
    @Body() createBlogDto: CreateBlogDto,
    @UserIdFromHeaders() userId: string,
  ) {
    const result = await this.commandBus.execute(
      new BlogCreateCommand(createBlogDto, +userId),
    );

    if (!result) {
      return exceptionHandler(ResultCode.NotFound, 'User not found', 'id');
    }

    return this.blogsService.findById(result);
  }

  @Post('blogs/:id/posts')
  async createPost(
    @Body() createPostDto: createPostByBlogIdDto,
    @Param('id') id: string,
    @UserIdFromHeaders() userId,
  ) {
    const result = await this.commandBus.execute(
      new PostCreateCommand(createPostDto, id, +userId),
    );

    if (result.code !== ResultCode.Success) {
      return exceptionHandler(result.code, result.message, result.field);
    }

    return this.postsService.findOneMapped(result.response, userId);
  }

  @HttpCode(204)
  @Put('blogs/:id')
  async updateBlog(
    @Param('id') blogId: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @UserIdFromHeaders() userId: string,
  ) {
    const result = await this.commandBus.execute(
      new BlogUpdateCommand(updateBlogDto, blogId, +userId),
    );

    if (result.code !== ResultCode.Success) {
      return exceptionHandler(result.code, result.message, result.field);
    }

    return result;
  }

  @HttpCode(204)
  @Put('blogs/:blogId/posts/:postId')
  async updatePost(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostByBloggerDto,
    @UserIdFromHeaders() userId: string,
  ) {
    const result = await this.commandBus.execute(
      new PostUpdateCommand(updatePostDto, blogId, postId, +userId),
    );

    if (result.code !== ResultCode.Success) {
      return exceptionHandler(result.code, result.message, result.field);
    }

    return result;
  }

  @HttpCode(204)
  @Delete('blogs/:id')
  async removeBlogById(
    @Param('id') id: string,
    @UserIdFromHeaders() userId: string,
  ) {
    const result = await this.commandBus.execute(
      new BlogDeleteCommand(id, +userId),
    );

    if (result.code !== ResultCode.Success) {
      return exceptionHandler(result.code, result.message, result.field);
    }

    return result;
  }

  @HttpCode(204)
  @Delete('blogs/:blogId/posts/:postId')
  async removePostById(
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @UserIdFromHeaders() userId: string,
  ) {
    const result = await this.commandBus.execute(
      new PostDeleteCommand(blogId, postId, +userId),
    );

    if (result.code !== ResultCode.Success) {
      return exceptionHandler(result.code, result.message, result.field);
    }

    return result;
  }

  ////Users

  @Get('users/blog/:id')
  async findAllBannedUsersForBlog(
    @Param('id') id: string,
    @Query() queryParams: BannedUsersQueryParamsDto,
    @UserIdFromHeaders() userId: string,
  ) {
    const result = await this.queryBus.execute(
      new UsersGetBannedQuery(queryParams, id, +userId),
    );

    if (result.code !== ResultCode.Success) {
      return exceptionHandler(result.code, result.message, result.field);
    }

    return result.response;
  }

  @HttpCode(204)
  @Put('users/:userId/ban')
  async changeBanStatusOfUser(
    @Param('userId') userId: string,
    @UserIdFromHeaders() bloggerId: string,
    @Body() banUserDto: BanUserForBlogDto,
  ) {
    const result = await this.commandBus.execute(
      new BloggerBanUserCommand(banUserDto, userId, +bloggerId),
    );

    if (result.code !== ResultCode.Success) {
      return exceptionHandler(result.code, result.message, result.field);
    }

    return result;
  }
}
