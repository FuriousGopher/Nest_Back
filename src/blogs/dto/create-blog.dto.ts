import { IsEmail, IsString, Matches, MaxLength } from '@nestjs/class-validator';

export class CreateBlogDto {
  @IsString()
  @MaxLength(15, {
    message: 'Name of blog max 15 char',
  })
  name: string;

  @IsString()
  @MaxLength(500, {
    message: 'Description of blog max 500 char',
  })
  description: string;

  @Matches(
    /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
    {
      message: 'Name should content only letters and numbers',
    },
  )
  websiteUrl: string;
}
