import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../db/schemas/users.schema';
import { Blog, BlogDocument } from '../db/schemas/blogs.schema';

@Injectable()
export class TestingService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Blog.name) private readonly blogModel: Model<BlogDocument>,
  ) {}

  async remove(): Promise<void> {
    try {
      await this.userModel.deleteMany({}).exec();
      await this.blogModel.deleteMany({}).exec();
    } catch (error) {
      throw new Error('Failed to delete all databases.');
    }
  }
}
