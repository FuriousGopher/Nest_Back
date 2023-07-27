import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsRepository } from './posts.repository';
import { BlogsRepository } from '../blogs/blogs.repository';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Comment } from '../db/schemas/comments.schema';
import { Model } from 'mongoose';
import { SaRepository } from '../sa/sa.repository';
import { CommentRepository } from '../comments/comment.repository';
import { CommentsQueryParamsDto } from './dto/comments-query-params.dto';
import { LikesDto } from './dto/like-status.dto';
import { Post, PostDocument } from '../db/schemas/posts.schema';
import { PostsQueryParamsDto } from './dto/posts-query-params.dto';

@Injectable()
export class PostsService {
  constructor(
    protected postsRepository: PostsRepository,
    protected saRepository: SaRepository,
    protected commentRepository: CommentRepository,
    protected blogsRepository: BlogsRepository,
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
  ) {}

  async create(createPostDto: CreatePostDto) {
    const blogName = await this.blogsRepository.findById(createPostDto.blogId);
    if (!blogName) {
      throw new NotFoundException('Blog not found');
    }
    try {
      const newPost = new this.postModel({
        title: createPostDto.title,
        shortDescription: createPostDto.shortDescription,
        content: createPostDto.content,
        blogId: createPostDto.blogId,
        blogName: blogName.name,
      });

      const savePost = await this.postsRepository.save(newPost);

      return {
        id: savePost._id.toString(),
        title: savePost.title,
        shortDescription: savePost.shortDescription,
        content: savePost.content,
        blogId: savePost.blogId,
        blogName: savePost.blogName,
        createdAt: savePost.createdAt,
        extendedLikesInfo: {
          likesCount: savePost.extendedLikesInfo.likesCount,
          dislikesCount: savePost.extendedLikesInfo.dislikesCount,
          myStatus: savePost.extendedLikesInfo.myStatus,
          newestLikes: [],
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

  async findAll(queryParams: PostsQueryParamsDto, userId: string) {
    return await this.postsRepository.findAllPosts(queryParams, userId);
  }

  findOneMapped(id: string, userId: string) {
    return this.postsRepository.findOneWithMapping(id, userId);
  }

  updateOne(id: string, updatePostDto) {
    return this.postsRepository.updateOne(id, updatePostDto);
  }

  remove(id: string) {
    return this.postsRepository.remove(id);
  }

  async createComment(
    id: string,
    createCommentDto: CreateCommentDto,
    userId: string,
  ) {
    const findPost = await this.postsRepository.findOne(id);
    const user = await this.saRepository.findOne(userId);
    if (!user) return false;

    if (!findPost) return false;

    const newComment = new this.commentModel({
      content: createCommentDto.content,
      commentatorInfo: {
        userId: userId,
        userLogin: user.accountData.login,
      },
      postId: id,
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        users: [
          {
            userId: userId,
            likeStatus: 'None',
          },
        ],
      },
    });

    await this.commentRepository.save(newComment);

    return {
      id: newComment._id.toString(),
      content: newComment.content,
      commentatorInfo: {
        userId: newComment.commentatorInfo.userId,
        userLogin: newComment.commentatorInfo.userLogin,
      },
      createdAt: newComment.createdAt,
      likesInfo: {
        likesCount: newComment.likesInfo.likesCount,
        dislikesCount: newComment.likesInfo.dislikesCount,
        myStatus: newComment.likesInfo.myStatus,
      },
    };
  }

  async findAllComments(
    id: string,
    queryParams: CommentsQueryParamsDto,
    userId: string,
  ) {
    const findPost = await this.postsRepository.findOne(id);

    if (!findPost) return false;

    return await this.commentRepository.findAllComments(
      id,
      queryParams,
      userId,
    );
  }

  async putNewLikeStatus(id: string, likeStatusDto: LikesDto, userId: string) {
    const likeStatus = likeStatusDto.likeStatus;
    const findPost = await this.postsRepository.findOne(id);
    if (!findPost) return false;
    const user = await this.saRepository.findOne(userId);
    if (!user) return false;

    const userLogin = user.accountData.login;

    let likesCount = findPost.extendedLikesInfo.likesCount;
    let dislikesCount = findPost.extendedLikesInfo.dislikesCount;

    const findUserInLikesInfo = await this.postsRepository.findUserInLikesInfo(
      id,
      userId,
    );

    if (!findUserInLikesInfo) {
      await this.postsRepository.addUserInLikesInfo(
        id,
        userId,
        userLogin,
        likeStatus,
      );

      if (likeStatus === 'Like') {
        likesCount++;
      }

      if (likeStatus === 'Dislike') {
        dislikesCount++;
      }
      return this.postsRepository.updateLikesCount(
        id,
        likesCount,
        dislikesCount,
      );
    }

    const userLikeDBStatus = await this.postsRepository.findUserLikeStatus(
      id,
      userId,
    );

    switch (userLikeDBStatus) {
      case 'None':
        if (likeStatus === 'Like') {
          likesCount++;
        }

        if (likeStatus === 'Dislike') {
          dislikesCount++;
        }

        break;

      case 'Like':
        if (likeStatus === 'None') {
          likesCount--;
        }

        if (likeStatus === 'Dislike') {
          likesCount--;
          dislikesCount++;
        }
        break;

      case 'Dislike':
        if (likeStatus === 'None') {
          dislikesCount--;
        }

        if (likeStatus === 'Like') {
          dislikesCount--;
          likesCount++;
        }
        break;
    }

    await this.postsRepository.updateLikesCount(id, likesCount, dislikesCount);

    return this.postsRepository.updateLikesStatus(id, userId, likeStatus);
  }

  async findOne(id: string) {
    return await this.postsRepository.findOne(id);
  }
}
