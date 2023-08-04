import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from '../db/schemas/blogs.schema';
import { BlogsRepository } from './blogs.repository';
import { Post, PostSchema } from '../db/schemas/posts.schema';
import { BasicStrategy } from '../auth/strategies/basic.strategy';
import { JwtBearerStrategy } from '../auth/strategies/jwt-bearer.strategy';
import { LocalStrategy } from '../auth/strategies/local.strategy';
import { JwtRefreshTokenStrategy } from '../auth/strategies/jwt-refresh.strategy';
import { AuthModule } from '../auth/auth.module';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PostsModule } from '../posts/posts.module';
import { UserMongo, UserSchema } from '../db/schemas/users.schema';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';

const strategies = [
  BasicStrategy,
  JwtBearerStrategy,
  LocalStrategy,
  JwtRefreshTokenStrategy,
];
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    MongooseModule.forFeature([{ name: UserMongo.name, schema: UserSchema }]),
    AuthModule,
    CqrsModule,
    JwtModule,
    PostsModule,
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [BlogsController],
  providers: [BlogsService, BlogsRepository, ...strategies],
  exports: [BlogsRepository, BlogsService],
})
export class BlogsModule {}
