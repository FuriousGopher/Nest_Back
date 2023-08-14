import { UpdateBlogDto } from '../../blogs/dto/update-blog.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../blogs/blogs.repository';
import { ExceptionResultType } from '../../exceptions/types/exception-result.type';
import { ResultCode } from '../../enums/result-code.enum';
export class BlogUpdateCommand {
  constructor(
    public blogInputDto: UpdateBlogDto,
    public blogId: string,
    public userId: number,
  ) {}
}

@CommandHandler(BlogUpdateCommand)
export class BlogUpdateUseCase implements ICommandHandler<BlogUpdateCommand> {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(
    command: BlogUpdateCommand,
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

    blog.name = command.blogInputDto.name;
    blog.description = command.blogInputDto.description;
    blog.websiteUrl = command.blogInputDto.websiteUrl;
    await this.blogsRepository.dataSourceSave(blog);

    return {
      data: true,
      code: ResultCode.Success,
    };
  }
}
