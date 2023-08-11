import { Module } from '@nestjs/common';
import { TestingService } from './testing.service';
import { TestingController } from './testing.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserMongo, UserSchema } from '../db/schemas/users.schema';
import { BlogMongo, BlogSchema } from '../db/schemas/blogs.schema';
import { PostMongo, PostSchema } from '../db/schemas/posts.schema';
import { CommentMongo, CommentSchema } from '../db/schemas/comments.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserMongo.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: BlogMongo.name, schema: BlogSchema }]),
    MongooseModule.forFeature([{ name: PostMongo.name, schema: PostSchema }]),
    MongooseModule.forFeature([
      { name: CommentMongo.name, schema: CommentSchema },
    ]),
  ],
  controllers: [TestingController],
  providers: [TestingService],
})
export class TestingModule {}
