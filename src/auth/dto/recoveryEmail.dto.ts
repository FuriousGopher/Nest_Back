import { IsNotEmpty } from 'class-validator';
import { IsEmail } from '@nestjs/class-validator';

export class RecoveryEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
