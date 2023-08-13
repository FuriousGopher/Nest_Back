import { TransactionBaseUseCase } from '../../auth/application/use-cases/transaction-base.use-case';
import { CommandHandler } from '@nestjs/cqrs';
import { CreateBlogDto } from '../../blogs/dto/create-blog.dto';
import { DataSource, EntityManager } from 'typeorm';
import { BlogsRepository } from '../../blogs/blogs.repository';
import { SaRepository } from '../../sa/sa.repository';
import { Blog } from '../../blogs/entities/blog.entity';
import { BlogBan } from '../../blogs/entities/blog-ban.entity';

export class BlogCreateCommand {
  constructor(public blogInputDto: CreateBlogDto, public userId: number) {}
}

@CommandHandler(BlogCreateCommand)
export class BlogCreateUseCase extends TransactionBaseUseCase<
  BlogCreateCommand,
  number | null
> {
  constructor(
    protected readonly dataSource: DataSource,
    protected readonly blogsRepository: BlogsRepository,
    protected readonly usersRepository: SaRepository,
  ) {
    super(dataSource);
  }

  async doLogic(
    command: BlogCreateCommand,
    manager: EntityManager,
  ): Promise<number | null> {
    const user = await this.usersRepository.findUserByIdSQL(command.userId);

    if (!user) {
      return null;
    }

    const blog = new Blog();
    blog.user = user;
    blog.name = command.blogInputDto.name;
    blog.description = command.blogInputDto.description;
    blog.websiteUrl = command.blogInputDto.websiteUrl;
    blog.createdAt = new Date();

    const savedBlog = await this.blogsRepository.queryRunnerSave(blog, manager);

    const blogBan = new BlogBan();
    blogBan.blog = blog;
    blogBan.isBanned = false;
    blogBan.banDate = null;
    await this.blogsRepository.queryRunnerSave(blogBan, manager);

    return savedBlog.id;
  }

  public async execute(command: BlogCreateCommand) {
    return super.execute(command);
  }
}
