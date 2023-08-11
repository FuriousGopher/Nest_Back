import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BanBlogDto } from '../dto/ban-blog.dto';
import { BlogsRepository } from '../../blogs/blogs.repository';

export class BlogBanCommand {
  constructor(public saBlogBanInputDto: BanBlogDto, public blogId: string) {}
}

@CommandHandler(BlogBanCommand)
export class BlogBanUseCase implements ICommandHandler<BlogBanCommand> {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(command: BlogBanCommand) {
    const blog = await this.blogsRepository.findBlogForBlogBanSQl(
      command.blogId,
    );

    if (!blog) {
      return null;
    }

    if (command.saBlogBanInputDto.isBanned) {
      blog.blogBan.blog = blog;
      blog.blogBan.isBanned = true;
      blog.blogBan.banDate = new Date();
      await this.blogsRepository.dataSourceSave(blog.blogBan);
    } else {
      blog.blogBan.blog = blog;
      blog.blogBan.isBanned = false;
      blog.blogBan.banDate = null;
      await this.blogsRepository.dataSourceSave(blog.blogBan);
    }

    return true;
  }
}
