import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../blogs/blogs.repository';
import { SaRepository } from '../sa.repository';
export class BlogBindCommand {
  constructor(public blogId: string, public userId: string) {}
}

@CommandHandler(BlogBindCommand)
export class BlogBindUseCase implements ICommandHandler<BlogBindCommand> {
  constructor(
    private readonly blogsRepository: BlogsRepository,
    private readonly usersRepository: SaRepository,
  ) {}

  async execute(command: BlogBindCommand) {
    const blog = await this.blogsRepository.findBlog(command.blogId);

    if (!blog) return false;
    if (blog.user.blog) return false;

    const user = await this.usersRepository.findUserByIdSQL(+command.userId);

    if (!user) return false;

    /*await this.blogsRepository.bindBlog(blog);*/ /// Check this

    return true;
  }
}
