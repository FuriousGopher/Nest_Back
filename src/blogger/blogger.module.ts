import { Module } from '@nestjs/common';
import { BloggerService } from './blogger.service';
import { BloggerController } from './blogger.controller';
import { BlogsModule } from '../blogs/blogs.module';

@Module({
  imports: [BlogsModule],
  controllers: [BloggerController],
  providers: [BloggerService],
})
export class BloggerModule {}
