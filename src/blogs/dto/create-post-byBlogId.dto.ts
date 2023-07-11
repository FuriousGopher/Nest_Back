import { IsString, MaxLength } from '@nestjs/class-validator';

export class createPostByBlogIdDto {
  @IsString()
  @MaxLength(30, {
    message: 'Title of post max 30 char',
  })
  title: string;

  @IsString()
  @MaxLength(100, {
    message: 'shortDescription of post max 100 char',
  })
  shortDescription: string;

  @IsString()
  @MaxLength(1000, {
    message: 'content of post max 1000 char',
  })
  content: string;
}
