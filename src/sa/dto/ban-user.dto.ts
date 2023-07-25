import {
  IsString,
  MinLength,
  IsNotEmpty,
  IsBoolean,
} from '@nestjs/class-validator';

export class BanUserDto {
  @IsBoolean()
  isBanned: boolean;

  @IsString()
  @MinLength(20)
  @IsNotEmpty()
  banReason: string;
}
