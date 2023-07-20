import {
  Controller,
  Get,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { exceptionHandler } from '../exceptions/exception.handler';
import { ResultCode } from '../enums/result-code.enum';
import { LikesDto } from '../posts/dto/like-status.dto';
import { UserIdFromHeaders } from '../decorators/user-id-from-headers.decorator';
import { JwtBearerGuard } from '../auth/guards/jwt-bearer.guard';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':id')
  async findOne(@Param('id') id: string, @UserIdFromHeaders() userId: string) {
    const result = await this.commentsService.findOne(id, userId);
    if (!result) {
      return exceptionHandler(
        ResultCode.NotFound,
        `Comment with id ${id} not found`,
        'id',
      );
    }
    return result;
  }

  @UseGuards(JwtBearerGuard)
  @HttpCode(204)
  @Put(':id/like-status')
  async updateLikeStatus(
    @Param('id') id: string,
    @Body() likesDto: LikesDto,
    @UserIdFromHeaders() userId: string,
  ) {
    const result = await this.commentsService.updateLikeStatus(
      id,
      likesDto,
      userId,
    );
    if (!result) {
      return exceptionHandler(
        ResultCode.NotFound,
        `Comment with ${id} not found`,
        'id',
      );
    }
  }

  @UseGuards(JwtBearerGuard)
  @HttpCode(204)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @UserIdFromHeaders() userId: string,
  ) {
    const findComment = await this.commentsService.findById(id);
    if (!findComment) {
      return exceptionHandler(
        ResultCode.NotFound,
        `Comment with ${id} not found`,
        'id',
      );
    }
    const checkOwner = await this.commentsService.checkOwner(id, userId);
    if (!checkOwner) {
      return exceptionHandler(
        ResultCode.Forbidden,
        `Comment with ${id} not yours`,
        'id',
      );
    }
    return await this.commentsService.update(id, updateCommentDto);
  }

  @UseGuards(JwtBearerGuard)
  @HttpCode(204)
  @Delete(':id')
  async remove(@Param('id') id: string, @UserIdFromHeaders() userId: string) {
    const findComment = await this.commentsService.findById(id);
    if (!findComment) {
      return exceptionHandler(
        ResultCode.NotFound,
        `Comment with ${id} not found`,
        'id',
      );
    }

    const checkOwner = await this.commentsService.checkOwner(id, userId);
    if (!checkOwner) {
      return exceptionHandler(
        ResultCode.Forbidden,
        `Comment with ${id} not found not yours`,
        'id',
      );
    }
    return await this.commentsService.remove(id);
  }
}
