import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';
import { CommentRepository } from '../comments/comment.repository';
import { BlogsRepository } from '../blogs/blogs.repository';
import { Comment, CommentSchema } from '../db/schemas/comments.schema';
import { Post, PostSchema } from '../db/schemas/posts.schema';
import { UserMongo, UserSchema } from '../db/schemas/users.schema';
import { Blog, BlogSchema } from '../db/schemas/blogs.schema';
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

const strategies = [
  BasicStrategy,
  JwtBearerStrategy,
  LocalStrategy,
  JwtRefreshTokenStrategy,
];

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: UserMongo.name, schema: UserSchema },
      { name: Blog.name, schema: BlogSchema },
    ]),
    AuthModule,
    CqrsModule,
    JwtModule,
    TypeOrmModule.forFeature([User]),
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
  ],
  exports: [PostsRepository, PostsService],
})
export class PostsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenParserMiddleware).forRoutes('*');
  }
}
