import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '../comment.repository';
import { ResultCode } from '../../enums/result-code.enum';
import { UpdateCommentDto } from '../dto/update-comment.dto';

export class CommentUpdateCommand {
  constructor(
    public commentInputDto: UpdateCommentDto,
    public commentId: string,
    public userId: number,
  ) {}
}

@CommandHandler(CommentUpdateCommand)
export class CommentUpdateUseCase
  implements ICommandHandler<CommentUpdateCommand>
{
  constructor(private readonly commentsRepository: CommentRepository) {}

  async execute(command: CommentUpdateCommand) {
    const postComment = await this.commentsRepository.findComment(
      command.commentId,
    );

    if (!postComment) {
      return {
        data: false,
        code: ResultCode.NotFound,
        field: 'id',
        message: 'Comment not found',
      };
    }

    if (postComment.user.id !== command.userId) {
      return {
        data: false,
        code: ResultCode.Forbidden,
      };
    }

    postComment.content = command.commentInputDto.content as any;
    await this.commentsRepository.dataSourceSave(postComment);

    return {
      data: true,
      code: ResultCode.Success,
    };
  }
}
