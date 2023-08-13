import { Module } from '@nestjs/common';
import { BloggerService } from './blogger.service';
import { BloggerController } from './blogger.controller';
import { BlogsModule } from '../blogs/blogs.module';
import { JwtBearerStrategy } from '../auth/strategies/jwt-bearer.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { SaModule } from '../sa/sa.module';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogMongo, BlogSchema } from '../db/schemas/blogs.schema';
import { PostsModule } from '../posts/posts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { BlogCreateUseCase } from './use-cases/blog-create.use-case';
import { BlogBanUseCase } from '../sa/use-cases/blog-ban.use-case';
import { BlogBindUseCase } from '../sa/use-cases/blog-bind.use-case';
import { BlogUpdateUseCase } from './use-cases/blog-update.use-case';
import { BlogDeleteUseCase } from './use-cases/blog-delete.use-case';
import { PostCreateUseCase } from './use-cases/post-create.use-case';
import { PostUpdateUseCase } from './use-cases/post-update.use-case';
import { PostDeleteUseCase } from './use-cases/post-delete.use-case';
import { CommentRepository } from '../comments/comment.repository';
import { CommentMongo, CommentSchema } from '../db/schemas/comments.schema';
import { Comment } from '../comments/entities/comment.entity';
import { UsersGetBannedUseCase } from './use-cases/users-get-banned.use-case';
import { BloggerBanUserUseCase } from './use-cases/user-ban.use-case';

const useCases = [
  BlogBanUseCase,
  BlogBindUseCase,
  BlogCreateUseCase,
  BlogUpdateUseCase,
  BlogDeleteUseCase,
  PostCreateUseCase,
  PostUpdateUseCase,
  PostDeleteUseCase,
  UsersGetBannedUseCase,
  BloggerBanUserUseCase,
  /*CommentCreateUseCase,
  CommentUpdateUseCase,
  CommentDeleteUseCase,
  LikeUpdateForPostUseCase,
  LikeUpdateForCommentUseCase,
  ,
,*/
];

const entities = [User, Comment];
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BlogMongo.name, schema: BlogSchema },
      { name: CommentMongo.name, schema: CommentSchema },
    ]),
    BlogsModule,
    PostsModule,
    PassportModule,
    SaModule,
    JwtModule,
    CqrsModule,
    AuthModule,
    TypeOrmModule.forFeature([...entities]),
  ],
  controllers: [BloggerController],
  providers: [
    BloggerService,
    JwtBearerStrategy,
    ...useCases,
    CommentRepository,
  ],
})
export class BloggerModule {}
