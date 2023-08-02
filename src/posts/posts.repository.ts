import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument } from '../db/schemas/posts.schema';
import { Model, Types } from 'mongoose';
import { PostsQueryParamsDto } from './dto/posts-query-params.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SaRepository } from '../sa/sa.repository';
import { Blog, BlogDocument } from '../db/schemas/blogs.schema';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    protected saRepository: SaRepository,
  ) {}

  async findAllPosts(queryParams: PostsQueryParamsDto, userId: string) {
    try {
      const {
        sortBy = 'createdAt',
        sortDirection = 'desc',
        pageNumber = 1,
        pageSize = 10,
      } = queryParams;

      const filter: any = {};

      const bannedBlogs = await this.blogModel
        .find({ 'banInfo.isBanned': true })
        .select('id')
        .exec();

      const bannedBlogIds = bannedBlogs.map((blog) => blog._id.toString());

      filter.blogId = { $nin: bannedBlogIds };

      const skipCount = (pageNumber - 1) * pageSize;

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
        items: await this.mapGetAllPosts(posts, userId),
      };
    } catch (e) {
      console.error('An error occurred while getting all posts', e);

      throw e;
    }
  }

  async mapGetAllPosts(array: PostDocument[], userId?: string) {
    return Promise.all(
      array.map(async (post) => {
        let status: string | undefined;

        const usersWithReaction = post.extendedLikesInfo.users;

        if (userId) {
          status = usersWithReaction.find(
            (u) => u.userId === userId,
          )?.likeStatus;
        }

        const usersIdsWithReaction = usersWithReaction.map(
          (u) => new Types.ObjectId(u.userId),
        );

        const bannedUsers =
          await this.saRepository.findBannedUsersFromArrayOfIds(
            usersIdsWithReaction,
          );

        const allowedUsers = usersWithReaction.filter(
          (u) => !bannedUsers.includes(u.userId),
        );

        const likesArray = allowedUsers.filter((u) => u.likeStatus === 'Like');

        const newestLikes = likesArray
          .sort((a, b) => -a.addedAt.localeCompare(b.addedAt))
          .map((like) => ({
            addedAt: like.addedAt.toString(),
            userId: like.userId,
            login: like.userLogin,
          }))
          .splice(0, 3);
        const likesCountCheck = likesArray.length;
        const dislikeCountCheck = allowedUsers.length - likesCountCheck;

        return {
          id: post._id.toString(),
          title: post.title,
          shortDescription: post.shortDescription,
          content: post.content,
          blogId: post.blogId,
          blogName: post.blogName,
          createdAt: post.createdAt,
          extendedLikesInfo: {
            likesCount: likesCountCheck,
            dislikesCount: dislikeCountCheck,
            myStatus: status || 'None',
            newestLikes,
          },
        };
      }),
    );
  }

  async save(newPost: PostDocument) {
    return await newPost.save();
  }

  async findOne(id: string) {
    return await this.postModel.findById({ _id: id }).exec();
  }

  async updateOne(id: string, updatePostDto: UpdatePostDto) {
    try {
      return await this.postModel
        .findByIdAndUpdate(
          { _id: id },
          {
            $set: updatePostDto,
          },
          { new: true },
        )
        .exec();
    } catch (e) {
      return false;
    }
  }

  async remove(id: string) {
    try {
      return await this.postModel.findByIdAndDelete(id).exec();
    } catch (e) {
      return false;
    }
  }

  async findUserInLikesInfo(postId: string, userId: string) {
    const result = await this.postModel.findOne({
      _id: postId,
      'extendedLikesInfo.users.userId': userId,
    });
    return !!result;
  }

  async addUserInLikesInfo(
    id: string,
    userId: string,
    userLogin: string,
    likeStatus: string,
  ) {
    const result = await this.postModel
      .findOneAndUpdate(
        {
          _id: id,
        },
        {
          $push: {
            'extendedLikesInfo.users': {
              addedAt: new Date().toISOString(),
              userId: userId,
              userLogin: userLogin,
              likeStatus: likeStatus,
            },
          },
        },
      )
      .exec();
    if (!result) return false;
    return result;
  }

  async updateLikesCount(id: string, likesCount: any, dislikesCount: any) {
    return this.postModel
      .findByIdAndUpdate(
        { _id: id },
        {
          $set: {
            'extendedLikesInfo.likesCount': likesCount,
            'extendedLikesInfo.dislikesCount': dislikesCount,
          },
        },
      )
      .exec();
  }

  async findUserLikeStatus(id: string, userId: string) {
    const result = await this.postModel
      .findOne({
        _id: new Types.ObjectId(id),
      })
      .exec();

    if (
      !result ||
      !result.extendedLikesInfo ||
      !result.extendedLikesInfo.users
    ) {
      console.log('if none');
      return 'None';
    }

    return result.extendedLikesInfo.users[0].likeStatus;
  }

  async updateLikesStatus(id: string, userId: string, likeStatus: string) {
    return this.postModel
      .findOneAndUpdate(
        {
          _id: id,
          'extendedLikesInfo.users.userId': userId,
        },
        {
          $set: {
            'extendedLikesInfo.users.$.likeStatus': likeStatus,
          },
        },
      )
      .exec();
  }

  async findOneWithMapping(id: string, userId: string) {
    try {
      const post = await this.postModel.findById(id);
      if (!post) {
        return false;
      }
      const findBlog = await this.blogModel.findById(post.blogId);
      if (findBlog!.banInfo.isBanned === true) {
        return false;
      }
      const mappedPost = await this.mapGetAllPosts([post], userId);
      return mappedPost[0];
    } catch (e) {
      console.error('An error occurred while getting post ', e);
      return false;
    }
  }

  async findAllComments(userId: string, queryParams: PostsQueryParamsDto) {}
}
