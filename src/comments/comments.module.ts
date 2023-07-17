import { Module } from '@nestjs/common';
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
import { UsersModule } from '../users/users.module';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from '../db/schemas/comments.schema';

const strategies = [
  BasicStrategy,
  JwtBearerStrategy,
  LocalStrategy,
  JwtRefreshTokenStrategy,
];
@Module({
  imports: [
    PassportModule,
    JwtModule,
    ConfigModule,
    UsersModule,
    CqrsModule,
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
  ],
  controllers: [CommentsController],
  providers: [CommentsService, ...strategies, CommentRepository, ConfigService],
  exports: [CommentRepository],
})
export class CommentsModule {}
