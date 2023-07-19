import { Controller, Get, Body, Param, Delete, Put } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { exceptionHandler } from '../exceptions/exception.handler';
import { ResultCode } from '../enums/result-code.enum';
import { LikesDto } from '../posts/dto/like-status.dto';
import { UserIdFromHeaders } from '../decorators/user-id-from-headers.decorator';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':id')
  async findById(@Param('id') id: string, @UserIdFromHeaders() userId: string) {
    const result = await this.commentsService.findById(id, userId);
    if (!result) {
      return exceptionHandler(
        ResultCode.BadRequest,
        `Comment with id ${id} not found`,
        'id',
      );
    }
    return result;
  }

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
        ResultCode.BadRequest,
        `Comment with ${id} not found`,
        'id',
      );
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    const result = await this.commentsService.update(id, updateCommentDto);
    if (!result) {
      return exceptionHandler(
        ResultCode.BadRequest,
        `Comment with ${id} not found`,
        'id',
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.commentsService.remove(id);
    if (!result) {
      return exceptionHandler(
        ResultCode.BadRequest,
        `Comment with id ${id} not found`,
        'id',
      );
    }
  }
}
