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
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsQueryParamsDto } from './dto/posts-query-params.dto';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';
import { exceptionHandler } from '../exceptions/exception.handler';
import { ResultCode } from '../enums/result-code.enum';
import { CommentsQueryParamsDto } from './dto/comments-query-params.dto';
import { UserIdFromHeaders } from '../decorators/user-id-from-headers.decorator';
import { JwtBearerGuard } from '../auth/guards/jwt-bearer.guard';
import { BasicAuthGuard } from '../auth/guards/basic-auth.guard';
import { LikesDto } from './dto/like-status.dto';
import { CommandBus } from '@nestjs/cqrs';
import { CommentCreateCommand } from '../comments/use-cases/comment-create.use-case';
import { CommentRepository } from '../comments/comment.repository';
import { LikeUpdateForPostCommand } from './use-cases/like-update-for-post-use.case';
import { postIDField, postNotFound } from '../exceptions/exception.constants';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private commandBus: CommandBus,
    private readonly commentRepository: CommentRepository,
  ) {}

  @UseGuards(BasicAuthGuard)
  @Post()
  async create(@Body() createPostDto: CreatePostDto) {
    const resultCreated = await this.postsService.create(createPostDto);
    if (!resultCreated) {
      return exceptionHandler(
        ResultCode.BadRequest,
        `Blog with this ${createPostDto.blogId} not found`,
        'id',
      );
    }
    return resultCreated;
  }

  @Get()
  async findAll(
    @Query() queryParams: PostsQueryParamsDto,
    @UserIdFromHeaders() userId: any,
  ) {
    const result = await this.postsService.findAll(queryParams, userId);
    if (!result) {
      return exceptionHandler(ResultCode.NotFound, `Posts not found`, 'all');
    }
    return result;
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @UserIdFromHeaders() userId: any) {
    const resultFindOne = await this.postsService.findOneMapped(id, userId);
    if (!resultFindOne) {
      return exceptionHandler(
        ResultCode.NotFound,
        `Post with this ${id} not found`,
        'id',
      );
    }
    return resultFindOne;
  }

  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    const result = await this.postsService.updateOne(id, updatePostDto);
    if (!result) {
      return exceptionHandler(
        ResultCode.NotFound,
        `Post with this ${id} not found`,
        'id',
      );
    }
  }

  @UseGuards(JwtBearerGuard)
  @Put(':id/like-status')
  @HttpCode(204)
  async makeLikeStatus(
    @Param('id') postId: string,
    @Body() likeStatusDto: LikesDto,
    @UserIdFromHeaders() userId,
  ) {
    const result = await this.commandBus.execute(
      new LikeUpdateForPostCommand(likeStatusDto, postId, userId),
    );

    if (!result) {
      return exceptionHandler(ResultCode.NotFound, 'Post not found', 'id');
    }

    return result;
  }

  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.postsService.remove(id);
    if (!result) {
      return exceptionHandler(
        ResultCode.NotFound,
        `Post with this ${id} not found`,
        'id',
      );
    }
  }

  ////Comments

  @UseGuards(JwtBearerGuard)
  @Post(':id/comments')
  async createComment(
    @Param('id') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @UserIdFromHeaders() userId: any,
  ) {
    const result = await this.commandBus.execute(
      new CommentCreateCommand(createCommentDto, postId, userId),
    );

    if (result.code !== ResultCode.Success) {
      return exceptionHandler(result.code, result.message, result.field);
    }

    return this.commentRepository.findByIdSQL(result.response, userId);
  }

  @Get(':id/comments')
  async findAllComments(
    @Param('id') id: string,
    @Query() queryParams: CommentsQueryParamsDto,
    @UserIdFromHeaders() userId: string,
  ) {
    const result = await this.postsService.findAllComments(
      id,
      queryParams,
      userId,
    );
    if (!result) {
      return exceptionHandler(
        ResultCode.NotFound,
        `Post with this ${id} not found`,
        'id',
      );
    }
    return result;
  }
}
