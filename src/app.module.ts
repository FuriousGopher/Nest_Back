import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { BlogsModule } from './blogs/blogs.module';
import { CommentsModule } from './comments/comments.module';
import { PostsModule } from './posts/posts.module';
import { AuthModule } from './auth/auth.module';
import { SecurityModule } from './security/security.module';
import { TestingModule } from './testing/testing.module';
import { APP_PIPE } from '@nestjs/core';

@Module({
  imports: [
    DbModule,
    ConfigModule.forRoot(),
    UsersModule,
    BlogsModule,
    CommentsModule,
    PostsModule,
    AuthModule,
    SecurityModule,
    TestingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
