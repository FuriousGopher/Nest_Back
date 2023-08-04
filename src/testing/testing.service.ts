import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserMongo, UserDocument } from '../db/schemas/users.schema';
import { Blog, BlogDocument } from '../db/schemas/blogs.schema';
import { Post, PostDocument } from '../db/schemas/posts.schema';
import { CommentDocument, Comment } from '../db/schemas/comments.schema';

@Injectable()
export class TestingService {
  constructor(
    @InjectModel(UserMongo.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Blog.name) private readonly blogModel: Model<BlogDocument>,
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,
  ) {}

  async remove(): Promise<void> {
    try {
      await this.userModel.deleteMany({}).exec();
      await this.blogModel.deleteMany({}).exec();
      await this.postModel.deleteMany({}).exec();
      await this.commentModel.deleteMany({}).exec();
    } catch (error) {
      throw new Error('Failed to delete all databases.');
    }
  }
}
