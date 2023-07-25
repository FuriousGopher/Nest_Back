import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { ConfigModule } from '@nestjs/config';
import { SaModule } from './sa/sa.module';
import { BlogsModule } from './blogs/blogs.module';
import { CommentsModule } from './comments/comments.module';
import { PostsModule } from './posts/posts.module';
import { AuthModule } from './auth/auth.module';
import { SecurityModule } from './security/security.module';
import { TestingModule } from './testing/testing.module';
import { BloggerModule } from './blogger/blogger.module';

@Module({
  imports: [
    DbModule,
    ConfigModule.forRoot({ isGlobal: true }),
    SaModule,
    BlogsModule,
    CommentsModule,
    PostsModule,
    AuthModule,
    SecurityModule,
    TestingModule,
    BloggerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [ConfigModule],
})
export class AppModule {}
