import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CommentMongo, CommentDocument } from '../db/schemas/comments.schema';
import { Model } from 'mongoose';
import { CommentsQueryParamsDto } from '../posts/dto/comments-query-params.dto';
import { SaRepository } from '../sa/sa.repository';
import { PostsQueryParamsDto } from '../posts/dto/posts-query-params.dto';
import { CommentLike } from './entities/comment-like.entity';
import { Paginator } from '../utils/paginator';
import { LikeStatus } from '../enums/like-status.enum';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectModel(CommentMongo.name)
    private commentModel: Model<CommentDocument>,
    protected saRepository: SaRepository,
    @InjectRepository(Comment) private commentsRepository: Repository<Comment>,
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(CommentLike)
    private readonly commentLikesRepository: Repository<CommentLike>,
  ) {}

  async save(newComment: CommentDocument) {
    return newComment.save();
  }

  async findComment(commentId: string) {
    try {
      return await this.commentsRepository
        .createQueryBuilder('c')
        .where(`c.id = :commentId`, {
          commentId: commentId,
        })
        .leftJoinAndSelect('c.user', 'u')
        .getOne();
    } catch (e) {
      return null;
    }
  }

  async findByIdSQL(commentId: number, userId: number) {
    try {
      const comments = await this.commentsRepository
        .createQueryBuilder('c')
        .addSelect(
          (qb) =>
            qb
              .select(`count(*)`)
              .from(CommentLike, 'cl')
              .leftJoin('cl.user', 'u')
              .leftJoin('u.userBanBySA', 'ubsa')
              .where('cl.commentId = c.id')
              .andWhere('ubsa.isBanned = false')
              .andWhere(`cl.likeStatus = 'Like'`),
          'likes_count',
        )
        .addSelect(
          (qb) =>
            qb
              .select(`count(*)`)
              .from(CommentLike, 'cl')
              .leftJoin('cl.user', 'u')
              .leftJoin('u.userBanBySA', 'ubsa')
              .where('cl.commentId = c.id')
              .andWhere('ubsa.isBanned = false')
              .andWhere(`cl.likeStatus = 'Dislike'`),
          'dislikes_count',
        )
        .addSelect(
          (qb) =>
            qb
              .select('cl.likeStatus')
              .from(CommentLike, 'cl')
              .where('cl.commentId = c.id')
              .andWhere('cl.userId = :userId', { userId: userId }),
          'like_status',
        )
        .where(`c.id = :commentId`, {
          commentId: commentId,
        })
        .andWhere(`ubsa.isBanned = false`)
        .leftJoinAndSelect('c.user', 'u')
        .leftJoinAndSelect('u.userBanBySA', 'ubsa')
        .getRawMany();

      const mappedComments = await this.commentsMapping(comments);
      return mappedComments[0];
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  private async commentsMapping(comments: any[]) {
    return comments.map((c) => {
      return {
        id: c.c_id.toString(),
        content: c.c_content,
        commentatorInfo: {
          userId: c.u_id.toString(),
          userLogin: c.u_login,
        },
        createdAt: c.c_created_at,
        likesInfo: {
          likesCount: Number(c.likes_count),
          dislikesCount: Number(c.dislikes_count),
          myStatus: c.like_status || LikeStatus.None,
        },
      };
    });
  }

  async findOne(id: string) {
    const result = await this.commentModel.findById({ _id: id }).exec();
    if (!result) return false;
    return result;
  }

  async findAllComments(
    postId: string,
    queryParams: CommentsQueryParamsDto,
    userId: string,
  ) {
    try {
      const query: CommentsQueryParamsDto = {
        pageSize: Number(queryParams.pageSize) || 10,
        pageNumber: Number(queryParams.pageNumber) || 1,
        sortBy: queryParams.sortBy ?? 'createdAt',
        sortDirection: queryParams.sortDirection ?? 'DESC',
      };

      const comments = await this.commentsRepository
        .createQueryBuilder('c')
        .addSelect(
          (qb) =>
            qb
              .select(`count(*)`)
              .from(CommentLike, 'cl')
              .leftJoin('cl.user', 'u')
              .leftJoin('u.userBanBySA', 'ubsa')
              .where('cl.commentId = c.id')
              .andWhere('ubsa.isBanned = false')
              .andWhere(`cl.likeStatus = 'Like'`),
          'likes_count',
        )
        .addSelect(
          (qb) =>
            qb
              .select(`count(*)`)
              .from(CommentLike, 'cl')
              .leftJoin('cl.user', 'u')
              .leftJoin('u.userBanBySA', 'ubsa')
              .where('cl.commentId = c.id')
              .andWhere('ubsa.isBanned = false')
              .andWhere(`cl.likeStatus = 'Dislike'`),
          'dislikes_count',
        )
        .addSelect(
          (qb) =>
            qb
              .select('cl.likeStatus')
              .from(CommentLike, 'cl')
              .where('cl.commentId = c.id')
              .andWhere('cl.userId = :userId', { userId: userId }),
          'like_status',
        )
        .where(`p.id = :postId`, {
          postId: postId,
        })
        .andWhere(`ubsa.isBanned = false`)
        .leftJoinAndSelect('c.post', 'p')
        .leftJoinAndSelect('c.user', 'u')
        .leftJoinAndSelect('u.userBanBySA', 'ubsa')
        .orderBy(`c.${query.sortBy}`, query.sortDirection)
        .limit(query.pageSize)
        .offset((query.pageNumber - 1) * query.pageSize)
        .getRawMany();

      const totalCount = await this.commentsRepository
        .createQueryBuilder('c')
        .where(`p.id = :postId`, {
          postId: postId,
        })
        .andWhere(`ubsa.isBanned = false`)
        .leftJoinAndSelect('c.post', 'p')
        .leftJoinAndSelect('c.user', 'u')
        .leftJoinAndSelect('u.userBanBySA', 'ubsa')
        .getCount();

      return Paginator.paginate({
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
        totalCount: totalCount,
        items: await this.commentsMapping(comments),
      });
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async findUserInLikesInfo(id: string, userId) {
    const result = await this.commentModel
      .findOne({ _id: id, 'likesInfo.users.userId': userId })
      .exec();
    if (!result) return false;
    return result;
  }

  async addUserInLikesInfo(id: string, userId, likeStatus: string) {
    const result = await this.commentModel.updateOne(
      { _id: id },
      {
        $push: {
          'likesInfo.users': {
            userId,
            likeStatus,
          },
        },
      },
    );
    return result.matchedCount === 1;
  }

  updateLikesCount(id: string, likesCount: number, dislikesCount: number) {
    return this.commentModel.updateOne(
      { _id: id },
      {
        $set: {
          'likesInfo.likesCount': likesCount,
          'likesInfo.dislikesCount': dislikesCount,
        },
      },
    );
  }

  async findUserLikeStatus(id: string, userId) {
    const result = await this.commentModel
      .findOne({ _id: id, 'likesInfo.users.userId': userId })
      .exec();
    if (!result || result.likesInfo.users.length === 0) {
      return null;
    }

    return result.likesInfo.users[0].likeStatus;
  }

  updateLikesStatus(id: string, userId, likeStatus: string) {
    return this.commentModel.updateOne(
      { _id: id, 'likesInfo.users.userId': userId },
      {
        $set: {
          'likesInfo.users.$.likeStatus': likeStatus,
        },
      },
    );
  }

  async remove(id: string) {
    const result = await this.commentModel.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }

  async update(id: string, content: string | undefined) {
    const result = await this.commentModel.updateOne(
      { _id: id },
      { $set: { content } },
    );
    return result.matchedCount === 1;
  }

  async findAllCommentsSQL(
    queryParams: CommentsQueryParamsDto,
    userId: number,
  ) {
    try {
      const query: CommentsQueryParamsDto = {
        pageSize: Number(queryParams.pageSize) || 10,
        pageNumber: Number(queryParams.pageNumber) || 1,
        sortBy: queryParams.sortBy ?? 'createdAt',
        sortDirection: queryParams.sortDirection ?? 'DESC',
      };

      const comments = await this.commentsRepository
        .createQueryBuilder('c')
        .addSelect(
          (qb) =>
            qb
              .select(`count(*)`)
              .from(CommentLike, 'cl')
              .leftJoin('cl.user', 'u')
              .leftJoin('u.userBanBySA', 'ubsa')
              .where('cl.commentId = c.id')
              .andWhere('ubsa.isBanned = false')
              .andWhere(`cl.likeStatus = 'Like'`),
          'likes_count',
        )
        .addSelect(
          (qb) =>
            qb
              .select(`count(*)`)
              .from(CommentLike, 'cl')
              .leftJoin('cl.user', 'u')
              .leftJoin('u.userBanBySA', 'ubsa')
              .where('cl.commentId = c.id')
              .andWhere('ubsa.isBanned = false')
              .andWhere(`cl.likeStatus = 'Dislike'`),
          'dislikes_count',
        )
        .addSelect(
          (qb) =>
            qb
              .select('cl.likeStatus')
              .from(CommentLike, 'cl')
              .where('cl.commentId = c.id')
              .andWhere('cl.userId = :userId', { userId: userId }),
          'like_status',
        )
        .where(`bu.id = :userId`, {
          userId: userId,
        })
        .andWhere(`ubsa.isBanned = false`)
        .leftJoinAndSelect('c.post', 'p')
        .leftJoinAndSelect('c.user', 'u')
        .leftJoinAndSelect('p.blog', 'b')
        .leftJoinAndSelect('b.user', 'bu')
        .leftJoinAndSelect('bu.userBanBySA', 'ubsa')
        .orderBy(`c.${query.sortBy}`, query.sortDirection)
        .limit(query.pageSize)
        .offset((query.pageNumber - 1) * query.pageSize)
        .getRawMany();

      const totalCount = await this.commentsRepository
        .createQueryBuilder('c')
        .where(`u.id = :userId`, {
          userId: userId,
        })
        .andWhere(`ubsa.isBanned = false`)
        .leftJoinAndSelect('c.post', 'p')
        .leftJoinAndSelect('p.blog', 'b')
        .leftJoinAndSelect('b.user', 'u')
        .leftJoinAndSelect('u.userBanBySA', 'ubsa')
        .getCount();

      return Paginator.paginate({
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
        totalCount: totalCount,
        items: await this.commentsOfBloggerMapping(comments),
      });
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  private async commentsOfBloggerMapping(comments: any[]) {
    return comments.map((c) => {
      return {
        id: c.c_id.toString(),
        content: c.c_content,
        createdAt: c.c_created_at,
        commentatorInfo: {
          userId: c.u_id.toString(),
          userLogin: c.u_login,
        },
        likesInfo: {
          likesCount: Number(c.likes_count),
          dislikesCount: Number(c.dislikes_count),
          myStatus: c.like_status || LikeStatus.None,
        },
        postInfo: {
          blogId: c.b_id.toString(),
          blogName: c.b_name,
          id: c.p_id.toString(),
          title: c.p_title,
        },
      };
    });
  }

  async dataSourceSave(entity: Comment | CommentLike) {
    return this.dataSource.manager.save(entity);
  }

  async deleteCommentSQL(commentId: number): Promise<boolean> {
    const result = await this.commentsRepository
      .createQueryBuilder('c')
      .delete()
      .from(Comment)
      .where('id = :commentId', { commentId: commentId })
      .execute();
    return result.affected === 1;
  }

  async findUserCommentLikeRecord(commentId: number, userId: number) {
    return this.commentLikesRepository
      .createQueryBuilder('cl')
      .where(`c.id = :commentId`, {
        commentId: commentId,
      })
      .andWhere(`u.id = :userId`, {
        userId: userId,
      })
      .leftJoinAndSelect('cl.comment', 'c')
      .leftJoinAndSelect('cl.user', 'u')
      .getOne();
  }
}
