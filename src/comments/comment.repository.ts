import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentDocument } from '../db/schemas/comments.schema';
import { Model } from 'mongoose';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async save(newComment: CommentDocument) {
    return newComment.save();
  }
}
