import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from '../db/schemas/blogs.schema';
import { Model } from 'mongoose';
import { BlogsQueryParamsDto } from './dto/blogs-query-params.dto';
import { BlogsResponseDto } from './dto/blogsResponse.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Post, PostDocument } from '../db/schemas/posts.schema';
import { PostsRepository } from '../posts/posts.repository';
import { PostsQueryParamsDto } from 'src/posts/dto/posts-query-params.dto';
import { CreateBlogDto } from './dto/create-blog.dto';
import { BannedUsersQueryParamsDto } from '../blogger/dto/banned-users-query-params.dto';
import { User, UserDocument } from '../db/schemas/users.schema';
import { BanUserForBlogDto } from '../sa/dto/ban-user-for-blog.dto';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(PostsRepository)
    protected postsRepository: PostsRepository,
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

  async findBlog(id: string) {
    try {
      return await this.blogModel.findById({ _id: id }).exec();
    } catch (e) {
      return false;
    }
  }

  async findById(id: string) {
    try {
      const blog = await this.blogModel.findById({ _id: id }).exec();
      if (!blog) {
        return false;
      }
      if (blog.banInfo.isBanned) return false;

      return {
        id: blog._id.toString(),
        name: blog.name,
        description: blog.description,
        websiteUrl: blog.websiteUrl,
        createdAt: blog.createdAt,
        isMembership: blog.isMembership,
      };
    } catch (e) {
      console.error('An error occurred while getting the blog:', e);

      return false;
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
      items: await this.postsRepository.mapGetAllPosts(posts, userId),
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

  async findAllOwnBlogs(userId: string) {
    const result = await this.blogModel
      .find({ 'blogOwnerInfo.userId': userId })
      .exec();
    if (!result) {
      return false;
    }
    return result;
  }

  async findAllOwenBlogsPagination(
    queryParams: BlogsQueryParamsDto,
    userId: string,
  ) {
    try {
      const {
        searchNameTerm = null,
        sortBy = 'createdAt',
        sortDirection = 'desc',
        pageNumber = 1,
        pageSize = 10,
      } = queryParams;

      const skipCount = (pageNumber - 1) * pageSize;
      const filter: any = { 'blogOwnerInfo.userId': userId };

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

  async findAllBannedUsersForBlog(
    blogId: string,
    queryParams: BannedUsersQueryParamsDto,
  ) {
    const {
      searchLoginTerm = queryParams.searchLoginTerm || null,
      sortBy = queryParams.sortBy || 'createdAt',
      sortDirection = queryParams.sortDirection || 'desc',
      pageNumber = queryParams.pageNumber || 1,
      pageSize = queryParams.pageSize || 10,
    } = queryParams;

    const sortKeyMapping = {
      login: 'accountData.login',
      createdAt: 'createdAt',
    };

    const sortKey = sortKeyMapping[sortBy] || 'createdAt';

    const skipCount = (pageNumber - 1) * pageSize;
    const filter: any = {
      banForBlogsInfo: {
        $elemMatch: { blogIds: blogId, isBanned: true },
      },
    };

    if (searchLoginTerm) {
      filter.$or = [
        {
          'accountData.login': {
            $regex: searchLoginTerm,
            $options: 'i',
          },
        },
      ];
    }

    const totalCount = await this.userModel.countDocuments(filter).exec();
    const totalPages = Math.ceil(totalCount / pageSize);

    const users = await this.userModel
      .find(filter)
      .sort({ [sortKey]: sortDirection === 'desc' ? -1 : 1 })
      .skip(skipCount)
      .limit(pageSize)
      .exec();

    const bannedUsersViewModels = users.map((user) => ({
      id: user._id.toString(),
      login: user.accountData.login,
      banInfo: {
        isBanned: user.banForBlogsInfo[0].isBanned,
        banDate: user.banForBlogsInfo[0].banDate,
        banReason: user.banForBlogsInfo[0].banReason,
      },
    }));

    return {
      pagesCount: totalPages,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: bannedUsersViewModels,
    };
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
}
