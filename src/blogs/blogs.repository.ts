import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from '../db/schemas/blogs.schema';
import { Model } from 'mongoose';
import { BlogsQueryParamsDto } from './dto/blogs-query-params.dto';
import { BlogsResponseDto } from './dto/blogsResponse.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Post, PostDocument } from '../db/schemas/posts.schema';
import { PostsRepository } from '../posts/posts.repository';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
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

  async create(createBlogDto) {
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

  async findOne(id: string) {
    try {
      const blog = await this.blogModel.findById({ _id: id }).exec();
      if (!blog) {
        return false;
      }
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

  async updateOne(id: string, updateBlogDto: UpdateBlogDto) {
    try {
      const updatedBlog = await this.blogModel
        .findByIdAndUpdate(
          { _id: id },
          {
            $set: updateBlogDto,
          },
          { new: true },
        )
        .exec();

      if (!updatedBlog) {
        return false;
      }

      return true;
    } catch (e) {
      console.error('An error occurred while updating the blog:', e);
      return false;
    }
  }

  async remove(id: string) {
    try {
      const deletedBlog = await this.blogModel.findByIdAndDelete(id).exec();
      if (!deletedBlog) {
        throw new NotFoundException('Blog not found');
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  async createPostByBlogId(createPostDto, blogId, blogName) {
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

  async findAllPosts(queryParams, blogId, userId) {
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
    }));

    return {
      pagesCount: totalPages,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: totalCount,
      items: blogsViewModels,
    };
  }
}
