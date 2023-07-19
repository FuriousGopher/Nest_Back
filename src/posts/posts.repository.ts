import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument } from '../db/schemas/posts.schema';
import { Model } from 'mongoose';
import { PostsQueryParamsDto } from './dto/posts-query-params.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsRepository {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async findAllPosts(
    queryParams: PostsQueryParamsDto,
    userId: string,
  ): Promise<{
    pagesCount: number;
    pageSize: number;
    page: number;
    totalCount: number;
    items: Awaited<{
      createdAt: Date;
      blogName: string;
      extendedLikesInfo: {
        likesCount: number;
        newestLikes: { addedAt: string; login: string; userId: string }[];
        dislikesCount: number;
        myStatus: string;
      };
      id: any;
      shortDescription: string;
      title: string;
      blogId: string;
      content: string;
    }>[];
  }> {
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

      const postsResponse = {
        pagesCount: totalPages,
        page: +pageNumber,
        pageSize: +pageSize,
        totalCount: totalCount,
        items: await this.mapGetAllPosts(posts, userId),
      };

      return postsResponse;
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
              .filter((post) => post.likeStatus === 'Like') /// will show only likes TODO
              .sort((a, b) => -a.addedAt.localeCompare(b.addedAt))
              .map((post) => {
                return {
                  addedAt: post.addedAt.toString(),
                  userId: post.userId,
                  login: post.userLogin,
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
    try {
      const post = await this.postModel.findById({ _id: id });
      if (!post) {
        return false;
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
          likesCount: post.extendedLikesInfo.likesCount,
          dislikesCount: post.extendedLikesInfo.dislikesCount,
          myStatus: 'None',
          newestLikes: [
            {
              addedAt: '',
              userId: '',
              login: '',
            },
          ],
        },
      };
    } catch (e) {
      console.error('An error occurred while getting post ', e);

      return false;
    }
  }

  async updateOne(id: string, updatePostDto: UpdatePostDto) {
    try {
      const updatedPost = await this.postModel
        .findByIdAndUpdate(
          id,
          {
            $set: updatePostDto,
          },
          { new: true },
        )
        .exec();

      if (!updatedPost) {
        return false;
      }

      return;
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
              addedAt: new Date(),
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

  async findUserLikeStatus(id: string, userId) {
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

  async findOneWitchMapping(id: string, userId: string) {
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
