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
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsQueryParamsDto } from './dto/posts-query-params.dto';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';
import { exceptionHandler } from '../exceptions/exception.handler';
import { ResultCode } from '../enums/result-code.enum';
import { LikeStatus } from '../enums/like-status.enum';
import { LikesDto } from './dto/like-status.dto';
import { JwtBearerGuard } from '../auth/guards/jwt-bearer.guard';
import { UserIdFromGuard } from '../decorators/user-id-from-guard.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

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
  @HttpCode(204)
  @Put(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.updateOne(id, updatePostDto);
  }

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
        'Post with this id not found',
        'id',
      );
    }
    return resultCreated;
  }
  /*
  @Get(':id/comments')
  async findAllComments(@Param('id') id: string) {
    const result = await this.postsService.findAllComments(id);
    if (!result) {
      return exceptionHandler(
        ResultCode.NotFound,
        'Post with this id not found',
        'id',
      );
    }
    return result;
  }

  @Put(':id/comments/like-status')
  async changeLikeStatus(
    @Param('id') id: string,
    @Body() likeStatusDto: LikesDto,
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
