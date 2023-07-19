import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsRepository } from './posts.repository';
import { BlogsRepository } from '../blogs/blogs.repository';
import { CreateCommentDto } from '../comments/dto/create-comment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Comment } from '../db/schemas/comments.schema';
import { Model } from 'mongoose';
import { UsersRepository } from '../users/users.repository';
import { CommentRepository } from '../comments/comment.repository';
import { CommentsQueryParamsDto } from './dto/comments-query-params.dto';

@Injectable()
export class PostsService {
  constructor(
    protected postsRepository: PostsRepository,
    protected usersRepository: UsersRepository,
    protected commentRepository: CommentRepository,
    protected blogsRepository: BlogsRepository,
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
  ) {}

  async create(createPostDto: CreatePostDto) {
    const blogName = await this.blogsRepository.findOne(createPostDto.blogId);
    if (!blogName) {
      throw new NotFoundException('Blog not found');
    }
    return this.postsRepository.create(createPostDto, blogName.name);
  }

  async findAll(queryParams) {
    return await this.postsRepository.findAllPosts(queryParams);
  }

  findOne(id: string) {
    return this.postsRepository.findOne(id);
  }

  updateOne(id: string, updatePostDto: UpdatePostDto) {
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
    const user = await this.usersRepository.findOne(userId);

    if (!findPost) return false;

    const newComment = new this.commentModel({
      content: createCommentDto.content,
      commentatorInfo: {
        userId: userId,
        userLogin: user!.accountData.login,
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
}
