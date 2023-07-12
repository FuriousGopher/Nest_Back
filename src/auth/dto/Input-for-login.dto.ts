import { IsString, IsNotEmpty } from '@nestjs/class-validator';

export class InputForLoginDto {
  @IsString()
  @IsNotEmpty()
  loginOrEmail: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
