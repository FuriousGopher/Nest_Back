import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';
import { CommentRepository } from '../comments/comment.repository';
import { BlogsRepository } from '../blogs/blogs.repository';
import { CommentMongo, CommentSchema } from '../db/schemas/comments.schema';
import { PostMongo, PostSchema } from '../db/schemas/posts.schema';
import { UserMongo, UserSchema } from '../db/schemas/users.schema';
import { BlogMongo, BlogSchema } from '../db/schemas/blogs.schema';
import { BasicStrategy } from '../auth/strategies/basic.strategy';
import { JwtBearerStrategy } from '../auth/strategies/jwt-bearer.strategy';
import { LocalStrategy } from '../auth/strategies/local.strategy';
import { JwtRefreshTokenStrategy } from '../auth/strategies/jwt-refresh.strategy';
import { AuthModule } from '../auth/auth.module';
import { CqrsModule } from '@nestjs/cqrs';
import { TokenParserMiddleware } from '../middlewares/token-parser.middleware';
import { JwtModule } from '@nestjs/jwt';
import { IsBlogExistConstraint } from '../decorators/blog-exists.decorator';
import { SaRepository } from '../sa/sa.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { UserBanByBlogger } from '../auth/entities/user-ban-by-blogger.entity';
import { UserEmailConfirmation } from '../auth/entities/user-email-confirmation.entity';
import { UserPasswordRecovery } from '../auth/entities/user-password-recovery.entity';
import { UserBanBySA } from '../auth/entities/user-ban-by-sa.entity';
import { Blog } from '../blogs/entities/blog.entity';
import { Post } from './entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';
import { CommentLike } from '../comments/entities/comment-like.entity';
import {
  CommentCreateCommand,
  CommentCreateUseCase,
} from '../comments/use-cases/comment-create.use-case';
import {
  LikeUpdateForPostCommand,
  LikeUpdateForPostUseCase,
} from './use-cases/like-update-for-post-use.case';
import { PostLike } from './entities/post-like.entity';

const strategies = [
  BasicStrategy,
  JwtBearerStrategy,
  LocalStrategy,
  JwtRefreshTokenStrategy,
];

const entities = [
  User,
  UserEmailConfirmation,
  UserPasswordRecovery,
  UserBanBySA,
  UserBanByBlogger,
  Blog,
  Post,
  Comment,
  CommentLike,
  PostLike,
];

const useCases = [CommentCreateUseCase, LikeUpdateForPostUseCase];

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PostMongo.name, schema: PostSchema },
      { name: CommentMongo.name, schema: CommentSchema },
      { name: UserMongo.name, schema: UserSchema },
      { name: BlogMongo.name, schema: BlogSchema },
    ]),
    AuthModule,
    CqrsModule,
    JwtModule,
    TypeOrmModule.forFeature([...entities]),
  ],
  controllers: [PostsController],
  providers: [
    PostsService,
    PostsRepository,
    CommentRepository,
    BlogsRepository,
    ...strategies,
    IsBlogExistConstraint,
    SaRepository,
    ...useCases,
  ],
  exports: [PostsRepository, PostsService],
})
export class PostsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenParserMiddleware).forRoutes('*');
  }
}
