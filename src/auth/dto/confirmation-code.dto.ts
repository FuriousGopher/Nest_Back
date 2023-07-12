import { IsNotEmpty } from 'class-validator';
import { IsString } from '@nestjs/class-validator';

export class ConfirmationCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
