import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../blogs/blogs.repository';
import { ExceptionResultType } from '../../exceptions/types/exception-result.type';
import { ResultCode } from '../../enums/result-code.enum';
import {
  blogIDField,
  blogNotFound,
} from '../../exceptions/exception.constants';

export class BlogDeleteCommand {
  constructor(public blogId: string, public userId: number) {}
}

@CommandHandler(BlogDeleteCommand)
export class BlogDeleteUseCase implements ICommandHandler<BlogDeleteCommand> {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(
    command: BlogDeleteCommand,
  ): Promise<ExceptionResultType<boolean>> {
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

    await this.blogsRepository.deleteBlog(blog.id);

    return {
      data: true,
      code: ResultCode.Success,
    };
  }
}
