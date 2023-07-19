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
  UseGuards,
  NestMiddleware,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsQueryParamsDto } from './dto/posts-query-params.dto';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';
import { exceptionHandler } from '../exceptions/exception.handler';
import { ResultCode } from '../enums/result-code.enum';
import { UserIdFromGuard } from '../decorators/user-id-from-guard.decorator';
import { CommentsQueryParamsDto } from './dto/comments-query-params.dto';
import { UserIdFromHeaders } from '../decorators/user-id-from-headers.decorator';
import { JwtBearerGuard } from '../auth/guards/jwt-bearer.guard';
import { BasicAuthGuard } from '../auth/guards/basic-auth.guard';
import { TokenParserMiddleware } from '../middlewares/token-parser.middleware';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(BasicAuthGuard)
  @Post()
  async create(@Body() createPostDto: CreatePostDto) {
    const resultCreated = await this.postsService.create(createPostDto);
    if (!resultCreated) {
      throw new NotFoundException(`Post not created`);
    }
    return resultCreated;
  }

  @Get()
  async findAll(@Query() queryParams: PostsQueryParamsDto) {
    const result = await this.postsService.findAll(queryParams);
    if (!result) {
      throw new NotFoundException(`Posts not found`);
    }
    return result;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const resultFindOne = await this.postsService.findOne(id);
    if (!resultFindOne) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }
    return resultFindOne;
  }

  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  @Put(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.updateOne(id, updatePostDto);
  }

  @UseGuards(BasicAuthGuard)
  @HttpCode(204)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }

  ////Comments

  @UseGuards(JwtBearerGuard)
  @Post(':id/comments')
  async createComment(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
    @UserIdFromGuard() userId,
  ) {
    const resultCreated = await this.postsService.createComment(
      id,
      createCommentDto,
      userId,
    );
    if (!resultCreated) {
      return exceptionHandler(
        ResultCode.NotFound,
        `Post with this ${id} not found`,
        'id',
      );
    }
    return resultCreated;
  }

  @Get(':id/comments')
  async findAllComments(
    @Param('id') id: string,
    @Query() queryParams: CommentsQueryParamsDto,
    @UserIdFromHeaders() userId,
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
  /*
  @UseGuards(JwtBearerGuard)
  @UseGuards(JwtRefreshGuard)
  @Put(':id/comments/like-status')
  async changeLikeStatus(
    @Param('id') id: string,
    @Body() likeStatusDto: LikesDto,
    @UserIdFromGuard() userId,
  ) {
    const result = await this.postsService.changeLikeStatus(id, likeStatusDto);
    if (!result) {
      return exceptionHandler(
        ResultCode.NotFound,
        'Post with this id not found',
        'id',
      );
    }
    return result;
  }*/
}
