import { IsNotEmpty } from 'class-validator';
import { IsEmail } from '@nestjs/class-validator';

export class EmailResendingDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
