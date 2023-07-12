import { IsNotEmpty } from 'class-validator';
import { IsString } from '@nestjs/class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
