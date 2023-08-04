import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Blog } from '../blogs/entities/blog.entity';
import { Device } from '../security/entities/device.entity';
import { Comment } from '../comments/entities/comment.entity';
import { CommentLike } from '../comments/entities/comment-like.entity';
import { PostLike } from '../posts/entities/post-like.entity';
import { BlogBan } from '../blogs/entities/blog-ban.entity';
import { UserBanByBlogger } from '../auth/entities/user-ban-by-blogger.entity';
import { UserBanBySA } from '../auth/entities/user-ban-by-sa.entity';
import { UserEmailConfirmation } from '../auth/entities/user-email-confirmation.entity';
import { UserPasswordRecovery } from '../auth/entities/user-password-recovery.entity';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: async (
        configService: ConfigService,
      ): Promise<TypeOrmModuleOptions> => ({
        type: 'postgres',
        host: configService.get('HOST'),
        port: configService.get('PORT'),
        username: 'postgres',
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        synchronize: true,
        logging: true,
        entities: [
          User,
          Post,
          Blog,
          Device,
          Comment,
          CommentLike,
          PostLike,
          BlogBan,
          UserBanByBlogger,
          UserBanBySA,
          UserEmailConfirmation,
          UserPasswordRecovery,
        ],
      }),
    }),
  ],
})
export class DbModule {}
