import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentDocument } from '../db/schemas/comments.schema';
import { Model } from 'mongoose';
import { CommentsQueryParamsDto } from '../posts/dto/comments-query-params.dto';
import { SaRepository } from '../sa/sa.repository';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    protected saRepository: SaRepository,
  ) {}

  async save(newComment: CommentDocument) {
    return newComment.save();
  }

  async findById(id: string, userId: string) {
    const result = await this.commentModel.findOne({ _id: id }).exec();
    if (!result) return false;
    let status;
    if (userId) {
      status = await this.findUserLikeStatus(id, userId);
    }

    const checkBanStatus = await this.saRepository.checkUserBanStatus(userId);

    if (!checkBanStatus) {
      return false;
    }

    return {
      id: result._id.toString(),
      content: result.content,
      commentatorInfo: {
        userId: result.commentatorInfo.userId,
        userLogin: result.commentatorInfo.userLogin,
      },
      createdAt: result.createdAt,
      likesInfo: {
        likesCount: result.likesInfo.likesCount,
        dislikesCount: result.likesInfo.dislikesCount,
        myStatus: status || 'None',
      },
    };
  }

  async findOne(id: string) {
    const result = await this.commentModel.findById({ _id: id }).exec();
    if (!result) return false;
    return result;
  }

  async findAllComments(
    id: string,
    queryParams: CommentsQueryParamsDto,
    userId: string,
  ) {
    const query = {
      pageSize: Number(queryParams.pageSize) || 10,
      pageNumber: Number(queryParams.pageNumber) || 1,
      sortBy: queryParams.sortBy ?? 'createdAt',
      sortDirection: queryParams.sortDirection ?? 'desc',
    };

    const sortKey = `${query.sortBy}`;

    const totalComments = await this.commentModel
      .countDocuments({ postId: id })
      .exec();

    const skipCount = (query.pageNumber - 1) * query.pageSize;
    const totalPages = Math.ceil(totalComments / query.pageSize);

    const comments = await this.commentModel
      .find({ postId: id })
      .sort({ [sortKey]: query.sortDirection === 'desc' ? -1 : 1 })
      .skip(skipCount)
      .limit(query.pageSize)
      .exec();

    const commentViewModel = comments.map((comment) => ({
      id: comment._id.toString(),
      content: comment.content,
      commentatorInfo: {
        userId: comment.commentatorInfo.userId,
        userLogin: comment.commentatorInfo.userLogin,
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: comment.likesInfo.likesCount,
        dislikesCount: comment.likesInfo.dislikesCount,
        myStatus: userId
          ? comment.likesInfo.users.find((user) => user.userId === userId)
              ?.likeStatus || 'None'
          : 'None',
      },
    }));

    return {
      pagesCount: totalPages,
      page: query.pageNumber,
      pageSize: query.pageSize,
      totalCount: totalComments,
      items: commentViewModel,
    };
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
}
