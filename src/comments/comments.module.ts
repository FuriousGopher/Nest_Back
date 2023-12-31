import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { BasicStrategy } from '../auth/strategies/basic.strategy';
import { JwtBearerStrategy } from '../auth/strategies/jwt-bearer.strategy';
import { LocalStrategy } from '../auth/strategies/local.strategy';
import { JwtRefreshTokenStrategy } from '../auth/strategies/jwt-refresh.strategy';
import { CommentRepository } from './comment.repository';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SaModule } from '../sa/sa.module';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentMongo, CommentSchema } from '../db/schemas/comments.schema';
import { AuthModule } from '../auth/auth.module';
import { TokenParserMiddleware } from '../middlewares/token-parser.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Comment } from './entities/comment.entity';
import { CommentDeleteUseCase } from './use-cases/comment-delete.use-case';
import { CommentUpdateUseCase } from './use-cases/comment-update.use-case';
import { LikeUpdateForCommentUseCase } from './use-cases/like-update-for-comment-use.case';
import { CommentLike } from './entities/comment-like.entity';

const strategies = [
  BasicStrategy,
  JwtBearerStrategy,
  LocalStrategy,
  JwtRefreshTokenStrategy,
];

const useCases = [
  CommentUpdateUseCase,
  CommentDeleteUseCase,
  LikeUpdateForCommentUseCase,
];

const entities = [User, Comment, CommentLike];
@Module({
  imports: [
    PassportModule,
    JwtModule,
    ConfigModule,
    SaModule,
    CqrsModule,
    MongooseModule.forFeature([
      { name: CommentMongo.name, schema: CommentSchema },
    ]),
    AuthModule,
    TypeOrmModule.forFeature([...entities]),
  ],
  controllers: [CommentsController],
  providers: [
    CommentsService,
    ...strategies,
    CommentRepository,
    ConfigService,
    ...useCases,
  ],
  exports: [CommentRepository],
})
export class CommentsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TokenParserMiddleware).forRoutes('*');
  }
}
