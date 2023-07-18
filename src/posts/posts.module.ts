import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';
import { CommentRepository } from '../comments/comment.repository';
import { UsersRepository } from '../users/users.repository';
import { BlogsRepository } from '../blogs/blogs.repository';
import { Comment, CommentSchema } from '../db/schemas/comments.schema';
import { Post, PostSchema } from '../db/schemas/posts.schema';
import { User, UserSchema } from '../db/schemas/users.schema';
import { Blog, BlogSchema } from '../db/schemas/blogs.schema';
import { BasicStrategy } from '../auth/strategies/basic.strategy';
import { JwtBearerStrategy } from '../auth/strategies/jwt-bearer.strategy';
import { LocalStrategy } from '../auth/strategies/local.strategy';
import { JwtRefreshTokenStrategy } from '../auth/strategies/jwt-refresh.strategy';
import { AuthModule } from '../auth/auth.module';
import { CqrsModule } from '@nestjs/cqrs';
import { TokenParserMiddleware } from '../middlewares/token-parser.middleware';

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
      { name: User.name, schema: UserSchema },
      { name: Blog.name, schema: BlogSchema },
    ]),
    AuthModule,
    CqrsModule,
  ],
  controllers: [PostsController],
  providers: [
    PostsService,
    PostsRepository,
    CommentRepository,
    UsersRepository,
    BlogsRepository,
    ...strategies,
  ],
})
export class PostsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenParserMiddleware).forRoutes('*');
    // Apply the TokenParserMiddleware to all routes in the module
  }
}
