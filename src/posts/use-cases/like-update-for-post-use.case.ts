import { LikesDto } from '../dto/like-status.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../posts.repository';
import { SaRepository } from '../../sa/sa.repository';
import { ResultCode } from '../../enums/result-code.enum';
import { PostLike } from '../entities/post-like.entity';

export class LikeUpdateForPostCommand {
  constructor(
    public likeStatusInputDto: LikesDto,
    public postId: string,
    public userId: number,
  ) {}
}

@CommandHandler(LikeUpdateForPostCommand)
export class LikeUpdateForPostUseCase
  implements ICommandHandler<LikeUpdateForPostCommand>
{
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly usersRepository: SaRepository,
  ) {}

  async execute(command: LikeUpdateForPostCommand) {
    const post = await this.postsRepository.findPostSQL(+command.postId);

    if (!post) {
      return null;
    }

    const user = await this.usersRepository.findUserByIdSQL(command.userId);

    if (!user) {
      return {
        data: false,
        code: ResultCode.NotFound,
        field: 'UserID',
        message: 'User not found',
      };
    }

    const userPostLikeRecord =
      await this.postsRepository.findUserPostLikeRecord(post.id, user.id);

    let likeRecord;

    if (userPostLikeRecord) {
      likeRecord = userPostLikeRecord;
    } else {
      likeRecord = new PostLike();
    }

    likeRecord.post = post;
    likeRecord.user = user;
    likeRecord.likeStatus = command.likeStatusInputDto.likeStatus;
    likeRecord.addedAt = new Date();

    await this.postsRepository.dataSourceSave(likeRecord);

    return {
      data: true,
      code: ResultCode.Success,
    };
  }
}
