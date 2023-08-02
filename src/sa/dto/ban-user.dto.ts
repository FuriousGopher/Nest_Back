import { IsBoolean } from '@nestjs/class-validator';

export class BanUserDto {
  @IsBoolean()
  isBanned: boolean;
}
