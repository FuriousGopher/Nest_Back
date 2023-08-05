import { IsBoolean, IsString, MinLength } from '@nestjs/class-validator';

export class BanUserDto {
  @IsBoolean()
  isBanned: boolean;

  @IsString()
  @MinLength(20)
  banReason: string;
}
