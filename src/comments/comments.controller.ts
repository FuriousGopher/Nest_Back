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
import { CommentUpdateCommand } from './use-cases/comment-update.use-case';
import { CommandBus } from '@nestjs/cqrs';
import { CommentDeleteCommand } from './use-cases/comment-delete.use-case';
import { LikeUpdateForCommentCommand } from './use-cases/like-update-for-comment-use.case';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private commandBus: CommandBus,
  ) {}

  @Get(':id')
  async findOne(@Param('id') id: number, @UserIdFromHeaders() userId: number) {
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
    @Param('id') commentId: string,
    @Body() likesDto: LikesDto,
    @UserIdFromHeaders() userId,
  ) {
    const result = await this.commandBus.execute(
      new LikeUpdateForCommentCommand(likesDto, commentId, userId),
    );

    if (result.code !== ResultCode.Success) {
      return exceptionHandler(result.code, result.message, result.field);
    }

    return result;
  }

  @UseGuards(JwtBearerGuard)
  @HttpCode(204)
  @Put(':id')
  async update(
    @Param('id') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @UserIdFromHeaders() userId: string,
  ) {
    const result = await this.commandBus.execute(
      new CommentUpdateCommand(updateCommentDto, commentId, +userId),
    );

    if (result.code !== ResultCode.Success) {
      return exceptionHandler(result.code, result.message, result.field);
    }

    return result;
  }

  @UseGuards(JwtBearerGuard)
  @HttpCode(204)
  @Delete(':id')
  async remove(
    @Param('id') commentId: string,
    @UserIdFromHeaders() userId: string,
  ) {
    const result = await this.commandBus.execute(
      new CommentDeleteCommand(commentId, +userId),
    );

    if (result.code !== ResultCode.Success) {
      return exceptionHandler(result.code, result.message, result.field);
    }

    return result;
  }
}
