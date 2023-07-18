import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentDocument } from '../db/schemas/comments.schema';
import { Model } from 'mongoose';
import { CommentsQueryParamsDto } from '../posts/dto/comments-query-params.dto';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async save(newComment: CommentDocument) {
    return newComment.save();
  }

  async findAllComments(id: string, queryParams: CommentsQueryParamsDto) {
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

    return {
      pagesCount: totalPages,
      page: query.pageNumber,
      pageSize: query.pageSize,
      totalCount: totalComments,
      items: comments,
    };
  }
}
