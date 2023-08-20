import { LikesDto } from '../../posts/dto/like-status.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '../comment.repository';
import { SaRepository } from '../../sa/sa.repository';
import { ResultCode } from '../../enums/result-code.enum';
import {
  commentIDField,
  commentNotFound,
  userIDField,
  userNotFound,
} from '../../exceptions/exception.constants';
import { CommentLike } from '../entities/comment-like.entity';

export class LikeUpdateForCommentCommand {
  constructor(
    public likeStatusInputDto: LikesDto,
    public commentId: string,
    public userId: number,
  ) {}
}

@CommandHandler(LikeUpdateForCommentCommand)
export class LikeUpdateForCommentUseCase
  implements ICommandHandler<LikeUpdateForCommentCommand>
{
  constructor(
    private readonly commentsRepository: CommentRepository,
    private readonly usersRepository: SaRepository,
  ) {}

  async execute(command: LikeUpdateForCommentCommand) {
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

    const user = await this.usersRepository.findUserByIdSQL(command.userId);

    if (!user) {
      return {
        data: false,
        code: ResultCode.NotFound,
        field: userIDField,
        message: userNotFound,
      };
    }

    const userCommentLikeRecord =
      await this.commentsRepository.findUserCommentLikeRecord(
        comment.id,
        user.id,
      );

    let likeRecord;

    if (userCommentLikeRecord) {
      likeRecord = userCommentLikeRecord;
    } else {
      likeRecord = new CommentLike();
    }

    likeRecord.comment = comment;
    likeRecord.user = user;
    likeRecord.likeStatus = command.likeStatusInputDto.likeStatus;

    await this.commentsRepository.dataSourceSave(likeRecord);

    return {
      data: true,
      code: ResultCode.Success,
    };
  }
}
