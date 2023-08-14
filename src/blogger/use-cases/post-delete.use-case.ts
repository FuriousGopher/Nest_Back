import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../blogs/blogs.repository';
import { PostsRepository } from '../../posts/posts.repository';
import { ExceptionResultType } from '../../exceptions/types/exception-result.type';
import { ResultCode } from '../../enums/result-code.enum';
import {
  blogIDField,
  blogNotFound,
  postIDField,
  postNotFound,
} from '../../exceptions/exception.constants';

export class PostDeleteCommand {
  constructor(
    public blogId: string,
    public postId: string,
    public userId: number,
  ) {}
}

@CommandHandler(PostDeleteCommand)
export class PostDeleteUseCase implements ICommandHandler<PostDeleteCommand> {
  constructor(
    private readonly blogsRepository: BlogsRepository,
    private readonly postsRepository: PostsRepository,
  ) {}

  async execute(command: PostDeleteCommand) {
    const blog = await this.blogsRepository.findBlogWithOwner(+command.blogId);

    if (!blog) {
      return {
        data: false,
        code: ResultCode.NotFound,
        field: 'blogId',
        message: 'Blog not found',
      };
    }

    const post = await this.postsRepository.findPostSQL(+command.postId);

    if (!post) {
      return {
        data: false,
        code: ResultCode.NotFound,
        field: 'postId',
        message: 'Post not found',
      };
    }

    if (blog.user.id !== command.userId) {
      return {
        data: false,
        code: ResultCode.Forbidden,
      };
    }

    await this.postsRepository.deletePostSQL(post.id);

    return {
      data: true,
      code: ResultCode.Success,
    };
  }
}
