import { CreateCommentDto } from '../dto/create-comment.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '../comment.repository';
import { PostsRepository } from '../../posts/posts.repository';
import { SaRepository } from '../../sa/sa.repository';
import { ResultCode } from '../../enums/result-code.enum';
import { Comment } from '../entities/comment.entity';

export class CommentCreateCommand {
  constructor(
    public commentInputDto: CreateCommentDto,
    public postId: string,
    public userId: number,
  ) {}
}

@CommandHandler(CommentCreateCommand)
export class CommentCreateUseCase
  implements ICommandHandler<CommentCreateCommand>
{
  constructor(
    private readonly commentsRepository: CommentRepository,
    private readonly postsRepository: PostsRepository,
    private readonly usersRepository: SaRepository,
  ) {}

  async execute(command: CommentCreateCommand) {
    const post = await this.postsRepository.findPostSQL(+command.postId);

    if (!post) {
      return {
        data: false,
        code: ResultCode.NotFound,
        field: 'id',
        message: 'Post not found',
      };
    }

    const user = await this.usersRepository.findUserForBanByBlogger(
      command.userId,
    );

    if (!user) {
      return {
        data: false,
        code: ResultCode.NotFound,
        field: 'id',
        message: 'User not found',
      };
    }

    if (user.userBanByBlogger!.isBanned) {
      return {
        data: false,
        code: ResultCode.Forbidden,
        message: 'User is banned',
      };
    }

    const comment = new Comment();
    comment.post = post;
    comment.user = user;
    comment.content = command.commentInputDto.content;
    comment.createdAt = new Date();
    await this.commentsRepository.dataSourceSave(comment);

    return {
      data: true,
      code: ResultCode.Success,
      response: comment.id,
    };
  }
}
