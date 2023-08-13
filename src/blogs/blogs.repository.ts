import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BlogMongo, BlogDocument } from '../db/schemas/blogs.schema';
import { Model } from 'mongoose';
import { BlogsQueryParamsDto } from './dto/blogs-query-params.dto';
import { BlogsResponseDto } from './dto/blogsResponse.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { PostMongo, PostDocument } from '../db/schemas/posts.schema';
import { PostsRepository } from '../posts/posts.repository';
import { PostsQueryParamsDto } from 'src/posts/dto/posts-query-params.dto';
import { CreateBlogDto } from './dto/create-blog.dto';
import { BannedUsersQueryParamsDto } from '../blogger/dto/banned-users-query-params.dto';
import { UserMongo, UserDocument } from '../db/schemas/users.schema';
import { BanUserForBlogDto } from '../sa/dto/ban-user-for-blog.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Blog } from './entities/blog.entity';
import { Paginator } from '../utils/paginator';
import { BlogBan } from './entities/blog-ban.entity';
import { Post } from '../posts/entities/post.entity';
import { UserQueryParamsDto } from '../sa/dto/userQueryParams.dto';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectModel(BlogMongo.name) private blogModel: Model<BlogDocument>,
    @InjectModel(PostMongo.name) private postModel: Model<PostDocument>,
    @InjectModel(UserMongo.name) private userModel: Model<UserDocument>,
    @Inject(PostsRepository)
    protected postsRepositoryM: PostsRepository,
    @InjectRepository(Blog) private blogsRepository: Repository<Blog>,
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async findAllBlogs(
    queryParams: BlogsQueryParamsDto,
  ): Promise<BlogsResponseDto | boolean> {
    try {
      const {
        searchNameTerm = null,
        sortBy = 'createdAt',
        sortDirection = 'desc',
        pageNumber = 1,
        pageSize = 10,
      } = queryParams;

      const skipCount = (pageNumber - 1) * pageSize;
      const filter: any = {};

      const bannedBlogs = await this.blogModel
        .find({ 'banInfo.isBanned': true })
        .select('id')
        .exec();

      const bannedBlogIds = bannedBlogs.map((blog) => blog._id.toString());

      if (searchNameTerm) {
        filter['name'] = {
          $regex: searchNameTerm,
          $options: 'i',
        };
      }

      if (bannedBlogIds.length > 0) {
        filter._id = { $nin: bannedBlogIds };
      }

      const totalCount = await this.blogModel.countDocuments(filter).exec();
      const totalPages = Math.ceil(totalCount / pageSize);

      const blogs = await this.blogModel
        .find(filter)
        .sort({ [sortBy]: sortDirection === 'desc' ? -1 : 1 })
        .skip(skipCount)
        .limit(pageSize)
        .exec();

      const blogsViewModels = blogs.map((blog) => ({
        id: blog._id.toString(),
        name: blog.name,
        description: blog.description,
        websiteUrl: blog.websiteUrl,
        createdAt: blog.createdAt,
        isMembership: blog.isMembership,
      }));

      return {
        pagesCount: totalPages,
        page: +pageNumber,
        pageSize: +pageSize,
        totalCount: totalCount,
        items: blogsViewModels,
      };
    } catch (e) {
      console.error('An error occurred while getting all blogs', e);
      return false;
    }
  }

  async create(createBlogDto: CreateBlogDto) {
    try {
      const ownerId = 'test potom peredelat';
      const newBlog = new this.blogModel({
        name: createBlogDto.name,
        description: createBlogDto.description,
        websiteUrl: createBlogDto.websiteUrl,
        ownerId: ownerId,
      });

      const createdBlog = await newBlog.save();

      return {
        id: createdBlog._id,
        name: createdBlog.name,
        description: createdBlog.description,
        websiteUrl: createdBlog.websiteUrl,
        createdAt: createdBlog.createdAt,
        isMembership: createdBlog.isMembership,
      };
    } catch (e) {
      console.error('An error occurred while creating a blog:', e);

      return {
        success: false,
        message: 'An error occurred while creating a blog.',
      };
    }
  }

  async findBlog(blogId: string) {
    try {
      return await this.blogsRepository
        .createQueryBuilder('b')
        .where(`b.id = :blogId`, { blogId: blogId })
        .getOne();
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async findByIdSQL(blogId: number | string) {
    try {
      const blogs = await this.blogsRepository
        .createQueryBuilder('b')
        .where(`b.id = :blogId`, {
          blogId: blogId,
        })
        .andWhere(`bb.isBanned = false`)
        .leftJoinAndSelect('b.blogBan', 'bb')
        .getMany();

      const mappedBlogs = await this.blogsMapping(blogs);
      return mappedBlogs[0];
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  async findOne(id: string) {
    try {
      const blog = await this.blogModel.findById({ _id: id }).exec();
      if (!blog) {
        return false;
      }
      return blog;
    } catch (e) {
      console.error('An error occurred while getting the blog:', e);

      return false;
    }
  }

  async updateOne(id: string, updateBlogDto: UpdateBlogDto) {
    try {
      return await this.blogModel
        .findByIdAndUpdate(
          { _id: id },
          {
            $set: updateBlogDto,
          },
          { new: true },
        )
        .exec();
    } catch (e) {
      console.error('An error occurred while updating the blog:', e);
      return false;
    }
  }

  async remove(id: string) {
    try {
      return await this.blogModel.findByIdAndDelete(id).exec();
    } catch (e) {
      return false;
    }
  }

  async createPostByBlogId(
    createPostDto: { title: any; shortDescription: any; content: any },
    blogId: any,
    blogName: string,
  ) {
    try {
      const newPost = new this.postModel({
        title: createPostDto.title,
        shortDescription: createPostDto.shortDescription,
        content: createPostDto.content,
        blogId: blogId,
        blogName: blogName,
      });

      const createdPost = await newPost.save();

      return {
        id: createdPost._id.toString(),
        title: createdPost.title,
        shortDescription: createdPost.shortDescription,
        content: createdPost.content,
        blogId: createdPost.blogId,
        blogName: createdPost.blogName,
        createdAt: createdPost.createdAt,
        extendedLikesInfo: {
          likesCount: createdPost.extendedLikesInfo.likesCount,
          dislikesCount: createdPost.extendedLikesInfo.dislikesCount,
          myStatus: 'None',
          newestLikes: [],
        },
      };
    } catch (e) {
      console.error('An error occurred while creating the blog:', e);
      return true;
    }
  }

  async findAllPosts(
    queryParams: PostsQueryParamsDto,
    blogId: string,
    userId: string | undefined,
  ) {
    const {
      sortBy = 'createdAt',
      sortDirection = 'desc',
      pageNumber = 1,
      pageSize = 10,
    } = queryParams;

    const skipCount = (pageNumber - 1) * pageSize;
    const filter: any = {
      blogId: blogId,
    };

    const totalCount = await this.postModel.countDocuments(filter).exec();
    const totalPages = Math.ceil(totalCount / pageSize);

    const posts = await this.postModel
      .find(filter)
      .sort({ [sortBy]: sortDirection === 'desc' ? -1 : 1 })
      .skip(skipCount)
      .limit(pageSize)
      .exec();

    return {
      pagesCount: totalPages,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: await this.postsRepositoryM.mapGetAllPosts(posts, userId),
    };
  }

  async bindBlog(id: string, userId: string, userLogin: string) {
    return this.blogModel.findByIdAndUpdate(
      { _id: id },
      {
        'blogOwnerInfo.userId': userId,
        'blogOwnerInfo.userLogin': userLogin,
      },
    );
  }

  async findAllBlogsForSA(queryParams: BlogsQueryParamsDto) {
    const {
      searchNameTerm = null,
      sortBy = 'createdAt',
      sortDirection = 'desc',
      pageNumber = 1,
      pageSize = 10,
    } = queryParams;

    const skipCount = (pageNumber - 1) * pageSize;
    const filter: any = {};

    if (searchNameTerm) {
      filter['name'] = {
        $regex: searchNameTerm,
        $options: 'i',
      };
    }

    const totalCount = await this.blogModel.countDocuments(filter).exec();
    const totalPages = Math.ceil(totalCount / pageSize);

    const blogs = await this.blogModel
      .find(filter)
      .sort({ [sortBy]: sortDirection === 'desc' ? -1 : 1 })
      .skip(skipCount)
      .limit(pageSize)
      .exec();

    const blogsViewModels = blogs.map((blog) => ({
      id: blog._id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
      blogOwnerInfo: {
        userId: blog.blogOwnerInfo.userId,
        userLogin: blog.blogOwnerInfo.userLogin,
      },
      banInfo: {
        isBanned: blog.banInfo.isBanned,
        banDate: blog.banInfo.banDate,
      },
    }));

    return {
      pagesCount: totalPages,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: blogsViewModels,
    };
  }

  async findBlogsForSASQL(query: BlogsQueryParamsDto) {
    const blogs = await this.blogsRepository
      .createQueryBuilder('b')
      .where(`${query.searchNameTerm ? 'b.name ilike :nameTerm' : ''}`, {
        nameTerm: `%${query.searchNameTerm}%`,
      })
      .leftJoinAndSelect('b.blogBan', 'bb')
      .leftJoinAndSelect('b.user', 'u')
      .orderBy(`b.${query.sortBy}`, query.sortDirection)
      .skip((query.pageNumber - 1) * query.pageSize)
      .take(query.pageSize)
      .getMany();

    const totalCount = await this.blogsRepository
      .createQueryBuilder('b')
      .where(`${query.searchNameTerm ? 'b.name ilike :nameTerm' : ''}`, {
        nameTerm: `%${query.searchNameTerm}%`,
      })
      .leftJoinAndSelect('b.blogBan', 'bb')
      .leftJoinAndSelect('b.user', 'u')
      .getCount();

    return Paginator.paginate({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      totalCount: totalCount,
      items: await this.blogsMappingForSA(blogs),
    });
  }

  private async blogsMappingForSA(blogs: Blog[]) {
    return blogs.map((b) => {
      return {
        id: b.id.toString(),
        name: b.name,
        description: b.description,
        websiteUrl: b.websiteUrl,
        createdAt: b.createdAt,
        isMembership: b.isMembership,
        blogOwnerInfo: {
          userId: b.user.id.toString(),
          userLogin: b.user.login,
        },
        banInfo: {
          isBanned: b.blogBan.isBanned,
          banDate: b.blogBan.banDate,
        },
      };
    });
  }

  async findAllOwnBlogs(userId: string) {
    const result = await this.blogModel
      .find({ 'blogOwnerInfo.userId': userId })
      .exec();
    if (!result) {
      return false;
    }
    return result;
  }

  async findAllOwenBlogsPagination(query: BlogsQueryParamsDto, userId: number) {
    const blogs = await this.blogsRepository
      .createQueryBuilder('b')
      .where(`${query.searchNameTerm ? 'b.name ilike :nameTerm' : ''}`, {
        nameTerm: `%${query.searchNameTerm}%`,
      })
      .andWhere(`u.id = :userId`, {
        userId: userId,
      })
      .leftJoinAndSelect('b.user', 'u')
      .orderBy(`b.${query.sortBy}`, query.sortDirection)
      .skip((query.pageNumber - 1) * query.pageSize)
      .take(query.pageSize)
      .getMany();

    const totalCount = await this.blogsRepository
      .createQueryBuilder('b')
      .where(`${query.searchNameTerm ? 'b.name ilike :nameTerm' : ''}`, {
        nameTerm: `%${query.searchNameTerm}%`,
      })
      .andWhere(`u.id = :userId`, {
        userId: userId,
      })
      .leftJoinAndSelect('b.user', 'u')
      .getCount();

    return Paginator.paginate({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      totalCount: totalCount,
      items: await this.blogsMapping(blogs),
    });
  }

  async save(newBlog: BlogDocument) {
    try {
      return await newBlog.save();
    } catch (e) {
      console.error('An error occurred while saving the blog', e);
      return false;
    }
  }

  async unBanBlog(id: string, banStatus: boolean) {
    return this.blogModel.findByIdAndUpdate(
      { _id: id },
      {
        'banInfo.isBanned': banStatus,
        'banInfo.banDate': null,
      },
    );
  }

  async banBlog(id: string, banStatus: boolean) {
    return this.blogModel.findByIdAndUpdate(
      { _id: id },
      {
        'banInfo.isBanned': banStatus,
        'banInfo.banDate': new Date().toISOString(),
      },
    );
  }

  async banUserForBlogs(banUserDto: BanUserForBlogDto, userId: string) {
    const updatedData = {
      $push: {
        banForBlogsInfo: {
          isBanned: banUserDto.isBanned,
          banDate: new Date().toISOString(),
          banReason: banUserDto.banReason,
          blogIds: banUserDto.blogId,
        },
      },
    };

    return await this.userModel
      .findByIdAndUpdate(userId, updatedData, { new: true })
      .exec();
  }

  async unBanUserForBlogs(userId: string, banUserDto: BanUserForBlogDto) {
    const updatedData = {
      $pull: {
        banForBlogsInfo: {
          isBanned: banUserDto.isBanned,
          banDate: null,
          banReason: null,
          blogIds: banUserDto.blogId,
        },
      },
    };

    return await this.userModel
      .findByIdAndUpdate(userId, updatedData, { new: true })
      .exec();
  }

  checkOwnerShip(userId: string, blogId: string) {
    return this.blogModel
      .findOne({ _id: blogId, 'blogOwnerInfo.userId': userId })
      .exec();
  }

  async findBlogForBlogBanSQl(blogId: string): Promise<Blog | null> {
    try {
      return await this.blogsRepository
        .createQueryBuilder('b')
        .where(`b.id = :blogId`, { blogId: blogId })
        .leftJoinAndSelect('b.blogBan', 'bb')
        .getOne();
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async dataSourceSave(entity: Blog | BlogBan): Promise<Blog | BlogBan> {
    return this.dataSource.manager.save(entity);
  }

  async queryRunnerSave(
    entity: Blog | BlogBan,
    queryRunnerManager: EntityManager,
  ): Promise<Blog | BlogBan> {
    return queryRunnerManager.save(entity);
  }

  async findAllBlogsSQl(queryParams: BlogsQueryParamsDto) {
    const query: BlogsQueryParamsDto = {
      pageSize: Number(queryParams.pageSize) || 10,
      pageNumber: Number(queryParams.pageNumber) || 1,
      sortBy: queryParams.sortBy ?? 'createdAt',
      sortDirection: queryParams.sortDirection ?? 'DESC',
      searchNameTerm: queryParams.searchNameTerm ?? '',
    };
    const blogs = await this.blogsRepository
      .createQueryBuilder('b')
      .where(`${query.searchNameTerm ? 'b.name ilike :nameTerm' : ''}`, {
        nameTerm: `%${query.searchNameTerm}%`,
      })
      .andWhere(`bb.isBanned = false`)
      .leftJoinAndSelect('b.blogBan', 'bb')
      .orderBy(`b.${query.sortBy}`, query.sortDirection)
      .skip((query.pageNumber - 1) * query.pageSize)
      .take(query.pageSize)
      .getMany();

    const totalCount = await this.blogsRepository
      .createQueryBuilder('b')
      .where(`${query.searchNameTerm ? 'b.name ilike :nameTerm' : ''}`, {
        nameTerm: `%${query.searchNameTerm}%`,
      })
      .andWhere(`bb.isBanned = false`)
      .leftJoinAndSelect('b.blogBan', 'bb')
      .getCount();

    return Paginator.paginate({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      totalCount: totalCount,
      items: await this.blogsMapping(blogs),
    });
  }

  private async blogsMapping(blogs: Blog[]) {
    return blogs.map((b) => {
      return {
        id: b.id.toString(),
        name: b.name,
        description: b.description,
        websiteUrl: b.websiteUrl,
        createdAt: b.createdAt,
        isMembership: b.isMembership,
      };
    });
  }

  async findBlogWithOwner(blogId: string) {
    try {
      return await this.blogsRepository
        .createQueryBuilder('b')
        .where(`b.id = :blogId`, { blogId: blogId })
        .leftJoinAndSelect('b.user', 'u')
        .getOne();
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async deleteBlog(blogId: number): Promise<boolean> {
    const result = await this.blogsRepository
      .createQueryBuilder('b')
      .delete()
      .from(Blog)
      .where('id = :blogId', { blogId: blogId })
      .execute();
    return result.affected === 1;
  }
}
