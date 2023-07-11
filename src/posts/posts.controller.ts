import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  Put,
  NotFoundException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsQueryParamsDto } from './dto/posts-query-params.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async create(@Body() createPostDto: CreatePostDto) {
    const resultCreated = await this.postsService.create(createPostDto);
    if (!resultCreated) {
      throw new NotFoundException(`Post not created`);
    }
    return resultCreated;
  }

  @Get()
  async findAll(@Query() queryParams: PostsQueryParamsDto) {
    const result = await this.postsService.findAll(queryParams);
    if (!result) {
      throw new NotFoundException(`Posts not found`);
    }
    return result;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const resultFindOne = await this.postsService.findOne(id);
    if (!resultFindOne) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }
    return resultFindOne;
  }
  @HttpCode(204)
  @Put(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.updateOne(id, updatePostDto);
  }

  @HttpCode(204)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}
