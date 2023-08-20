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
    const comment = await this.commentsRepository.findComment(
      command.commentId,
    );

    if (!comment) {
      return {
        data: false,
        code: ResultCode.NotFound,
        field: 'id',
        message: 'Comment not found',
      };
    }

    if (comment.user.id !== command.userId) {
      return {
        data: false,
        code: ResultCode.Forbidden,
      };
    }

    comment.content = command.commentInputDto.content;
    await this.commentsRepository.dataSourceSave(comment);

    return {
      data: true,
      code: ResultCode.Success,
    };
  }
}
