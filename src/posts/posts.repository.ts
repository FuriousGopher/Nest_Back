import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument } from '../db/schemas/posts.schema';
import { Model } from 'mongoose';
import { PostsQueryParamsDto } from './dto/posts-query-params.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SaRepository } from '../sa/sa.repository';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
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

      const skipCount = (pageNumber - 1) * pageSize;
      const filter: any = {};

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
        let status;

        if (userId) {
          status = await this.findUserLikeStatus(post._id.toString(), userId);
        }
        const likesArray =
          post.extendedLikesInfo && post.extendedLikesInfo.users
            ? post.extendedLikesInfo.users
            : [];
        const likesCountCheck = post.extendedLikesInfo
          ? post.extendedLikesInfo.likesCount
          : 0;
        const dislikeCountCheck = post.extendedLikesInfo
          ? post.extendedLikesInfo.dislikesCount
          : 0;

        const checkBanStatus = userId
          ? await this.saRepository.checkUserBanStatus(userId)
          : false;

        const bannedUserIds = new Set<string>();
        if (userId && checkBanStatus) {
          const bannedUserLikes = likesArray.filter((like) => {
            if (like.likeStatus === 'Like' && like.userId !== userId) {
              bannedUserIds.add(like.userId);
              return false;
            }
            return true;
          });

          likesArray.splice(0, likesArray.length, ...bannedUserLikes);
        }

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
            newestLikes: likesArray
              .filter((like) => !bannedUserIds.has(like.userId))
              .filter((like) => like.likeStatus === 'Like')
              .sort((a, b) => -a.addedAt.localeCompare(b.addedAt))
              .map((like) => {
                return {
                  addedAt: like.addedAt.toString(),
                  userId: like.userId,
                  login: like.userLogin,
                };
              })
              .splice(0, 3),
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
      const updatedPost = await this.postModel
        .findByIdAndUpdate(
          { _id: id },
          {
            $set: updatePostDto,
          },
          { new: true },
        )
        .exec();

      if (!updatedPost) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  async remove(id: string) {
    try {
      const deletedPost = await this.postModel.findByIdAndDelete(id).exec();
      if (!deletedPost) {
        throw new NotFoundException('Post not found');
      }
      return true;
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

  updateLikesCount(id: string, likesCount: any, dislikesCount: any) {
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
        _id: id,
        'extendedLikesInfo.users.userId': userId,
      })
      .exec();

    if (
      !result ||
      !result.extendedLikesInfo ||
      !result.extendedLikesInfo.users
    ) {
      return 'None';
    }

    return result.extendedLikesInfo.users[0].likeStatus;
  }

  updateLikesStatus(id: string, userId, likeStatus: string) {
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
      const mappedPost = await this.mapGetAllPosts([post], userId);
      return mappedPost[0];
    } catch (e) {
      console.error('An error occurred while getting post ', e);
      return false;
    }
  }
}
