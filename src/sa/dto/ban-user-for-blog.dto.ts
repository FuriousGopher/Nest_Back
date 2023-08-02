import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  MinLength,
} from '@nestjs/class-validator';

export class BanUserForBlogDto {
  @IsBoolean()
  isBanned: boolean;

  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  banReason: string;

  @IsString()
  @IsNotEmpty()
  blogId: string;
}
