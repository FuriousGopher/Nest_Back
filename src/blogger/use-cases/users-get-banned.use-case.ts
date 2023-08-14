import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BannedUsersQueryParamsDto } from '../dto/banned-users-query-params.dto';
import { BlogsRepository } from '../../blogs/blogs.repository';
import { SaRepository } from '../../sa/sa.repository';
import { ResultCode } from '../../enums/result-code.enum';

export class UsersGetBannedQuery {
  constructor(
    public bloggerUserBanQueryDto: BannedUsersQueryParamsDto,
    public blogId: string,
    public userId: number,
  ) {}
}

@QueryHandler(UsersGetBannedQuery)
export class UsersGetBannedUseCase
  implements IQueryHandler<UsersGetBannedQuery>
{
  constructor(
    private readonly blogsRepository: BlogsRepository,
    private readonly saRepository: SaRepository,
  ) {}

  async execute(query: UsersGetBannedQuery) {
    const blog = await this.blogsRepository.findBlogWithOwner(+query.blogId);

    if (!blog) {
      return {
        data: false,
        code: ResultCode.NotFound,
        field: 'blogId',
        message: 'Blog not found',
      };
    }

    if (blog.user.id !== query.userId) {
      return {
        data: false,
        code: ResultCode.Forbidden,
      };
    }

    const response = await this.saRepository.findUsersBannedByBlogger(
      query.bloggerUserBanQueryDto,
      blog.id,
    );

    return {
      data: true,
      code: ResultCode.Success,
      response: response,
    };
  }
}
