import { IsString, MaxLength } from '@nestjs/class-validator';
import { isBlogExist } from '../../decorators/blog-exists.decorator';
import { IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePostDto {
  @IsString()
  @MaxLength(30, {
    message: 'Title of post max 30 char',
  })
  @IsNotEmpty()
  title: string;

  @IsString()
  @MaxLength(100, {
    message: 'shortDescription of post max 100 char',
  })
  @IsNotEmpty()
  shortDescription: string;

  @IsString()
  @MaxLength(1000, {
    message: 'content of post max 1000 char',
  })
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  content: string;

  @IsString()
  @isBlogExist()
  blogId: string;
}
