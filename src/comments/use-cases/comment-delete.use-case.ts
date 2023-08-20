import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '../comment.repository';
import { ResultCode } from '../../enums/result-code.enum';
import {
  commentIDField,
  commentNotFound,
} from '../../exceptions/exception.constants';

export class CommentDeleteCommand {
  constructor(public commentId: string, public userId: number) {}
}

@CommandHandler(CommentDeleteCommand)
export class CommentDeleteUseCase
  implements ICommandHandler<CommentDeleteCommand>
{
  constructor(private readonly commentsRepository: CommentRepository) {}

  async execute(command: CommentDeleteCommand) {
    const comment = await this.commentsRepository.findComment(
      command.commentId,
    );

    if (!comment) {
      return {
        data: false,
        code: ResultCode.NotFound,
        field: 'commentId',
        message: 'Comment not found',
      };
    }

    if (comment.user.id !== command.userId) {
      return {
        data: false,
        code: ResultCode.Forbidden,
      };
    }

    await this.commentsRepository.deleteCommentSQL(comment.id);

    return {
      data: true,
      code: ResultCode.Success,
    };
  }
}
