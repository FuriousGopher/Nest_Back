import { BanUserForBlogDto } from '../../sa/dto/ban-user-for-blog.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../blogs/blogs.repository';
import { SaRepository } from '../../sa/sa.repository';
import { ResultCode } from '../../enums/result-code.enum';

export class BloggerBanUserCommand {
  constructor(
    public banUserDto: BanUserForBlogDto,
    public userId: string,
    public bloggerId: number,
  ) {}
}

@CommandHandler(BloggerBanUserCommand)
export class BloggerBanUserUseCase
  implements ICommandHandler<BloggerBanUserCommand>
{
  constructor(
    private readonly saRepository: SaRepository,
    private readonly blogsRepository: BlogsRepository,
  ) {}

  async execute(command: BloggerBanUserCommand) {
    const user = await this.saRepository.findUserForBanByBlogger(
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

    const blog = await this.blogsRepository.findBlogWithOwner(
      +command.banUserDto.blogId,
    );

    if (!blog) {
      return {
        data: false,
        code: ResultCode.NotFound,
        field: 'id',
        message: 'Blog not found',
      };
    }

    if (blog.user.id !== command.bloggerId) {
      return {
        data: false,
        code: ResultCode.Forbidden,
      };
    }

    if (command.banUserDto.isBanned) {
      user.userBanByBlogger!.user = user;
      user.userBanByBlogger!.blog = blog;
      user.userBanByBlogger!.isBanned = true;
      user.userBanByBlogger!.banReason = command.banUserDto.banReason;
      user.userBanByBlogger!.banDate = new Date();
      await this.saRepository.dataSourceSaveSQL(user.userBanByBlogger!);
    } else {
      user.userBanByBlogger!.isBanned = false;
      user.userBanByBlogger!.banReason = null;
      user.userBanByBlogger!.banDate = null;
      await this.saRepository.dataSourceSaveSQL(user.userBanByBlogger!);
    }

    return {
      data: true,
      code: ResultCode.Success,
    };
  }
}
