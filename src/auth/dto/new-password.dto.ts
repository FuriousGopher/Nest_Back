import { IsNotEmpty, Length } from 'class-validator';
import { IsString } from '@nestjs/class-validator';

export class NewPasswordDto {
  @Length(6, 20)
  @IsNotEmpty()
  @IsString()
  newPassword: string;

  @IsString()
  recoveryCode: string;
}
