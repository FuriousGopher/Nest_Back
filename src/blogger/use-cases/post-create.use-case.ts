import { createPostByBlogIdDto } from '../../blogs/dto/create-post-byBlogId.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../posts/posts.repository';
import { BlogsRepository } from '../../blogs/blogs.repository';
import { ResultCode } from '../../enums/result-code.enum';
import { Post } from '../../posts/entities/post.entity';

export class PostCreateCommand {
  constructor(
    public postInputDto: createPostByBlogIdDto,
    public blogId: string,
    public userId: number,
  ) {}
}

@CommandHandler(PostCreateCommand)
export class PostCreateUseCase implements ICommandHandler<PostCreateCommand> {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async execute(command: PostCreateCommand) {
    const blog = await this.blogsRepository.findBlogWithOwner(+command.blogId);

    if (!blog) {
      return {
        data: false,
        code: ResultCode.NotFound,
        field: 'blogId',
        message: 'Blog not found',
      };
    }

    if (blog.user.id !== command.userId) {
      return {
        data: false,
        code: ResultCode.Forbidden,
      };
    }

    const post = new Post();
    post.blog = blog;
    post.title = command.postInputDto.title;
    post.shortDescription = command.postInputDto.shortDescription;
    post.content = command.postInputDto.content;
    post.createdAt = new Date();
    const savedPost = await this.postsRepository.dataSourceSave(post);

    return {
      data: true,
      code: ResultCode.Success,
      response: savedPost.id,
    };
  }
}
