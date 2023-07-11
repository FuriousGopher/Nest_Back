import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument } from '../db/schemas/posts.schema';
import { Model } from 'mongoose';
import { PostsQueryParamsDto } from './dto/posts-query-params.dto';
import { PostsResponseDto } from './dto/postsResponse.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsRepository {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async findAllPosts(
    queryParams: PostsQueryParamsDto,
  ): Promise<PostsResponseDto | { message: string } | { success: boolean }> {
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

      const postsViewModels = posts.map((post) => ({
        id: post._id.toString(),
        title: post.title,
        shortDescription: post.shortDescription,
        content: post.content,
        blogId: post.blogId,
        blogName: post.blogName,
        createdAt: post.createdAt.toISOString(),
        extendedLikesInfo: {
          likesCount: post.likesInfo.likesCount,
          dislikesCount: post.likesInfo.dislikesCount,
          myStatus: 'None',
          newestLikes: [
            {
              addedAt: '',
              userId: '',
              login: '',
            },
          ],
        },
      }));

      const postsResponse: PostsResponseDto = {
        pagesCount: totalPages,
        page: +pageNumber,
        pageSize: +pageSize,
        totalCount: totalCount,
        items: postsViewModels,
      };

      return postsResponse;
    } catch (e) {
      console.error('An error occurred while getting all posts', e);

      return {
        success: false,
        message: 'An error occurred while getting all posts',
      };
    }
  }

  async create(createPostDto, blogName) {
    try {
      const newPost = new this.postModel({
        title: createPostDto.title,
        shortDescription: createPostDto.shortDescription,
        content: createPostDto.content,
        blogId: createPostDto.blogId,
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
          likesCount: createdPost.likesInfo.likesCount,
          dislikesCount: createdPost.likesInfo.dislikesCount,
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
      console.error('An error occurred while creating a post:', e);

      return {
        success: false,
        message: 'An error occurred while creating a post.',
      };
    }
  }

  async findOne(id: string) {
    try {
      const post = await this.postModel.findById(id).exec();
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
          likesCount: post.likesInfo.likesCount,
          dislikesCount: post.likesInfo.dislikesCount,
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
        throw new NotFoundException('Post not found');
      }

      return;
    } catch (e) {
      console.error('An error occurred while updating the post:', e);

      throw new NotFoundException();
    }
  }

  async remove(id: string) {
    try {
      const deletedPost = await this.postModel.findByIdAndDelete(id).exec();
      if (!deletedPost) {
        throw new NotFoundException('Post not found');
      }
      return;
    } catch (e) {
      console.error('An error occurred while deleting the post:', e);
      if (e instanceof NotFoundException) {
        throw e;
      }
    }
  }
}
