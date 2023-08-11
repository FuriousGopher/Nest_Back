import { IsBoolean } from '@nestjs/class-validator';

export class BanBlogDto {
  @IsBoolean()
  isBanned: boolean;
}
