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
import { Blog, BlogSchema } from '../db/schemas/blogs.schema';
import { PostsModule } from '../posts/posts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
    BlogsModule,
    PostsModule,
    PassportModule,
    SaModule,
    JwtModule,
    CqrsModule,
    AuthModule,
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [BloggerController],
  providers: [BloggerService, JwtBearerStrategy],
})
export class BloggerModule {}
