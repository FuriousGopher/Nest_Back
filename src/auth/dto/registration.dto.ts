import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from '@nestjs/class-validator';
import { IsEmailExist } from '../../decorators/unique-email.decorator';
import { IsLoginExist } from '../../decorators/unique-login.decorator';

export class RegistrationDto {
  @IsLoginExist({
    message: 'Login is already exist',
  })
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]*$/, {
    message: 'Name should content only letters and numbers',
  })
  @MinLength(3, {
    message: 'Name min 3 char',
  })
  @MaxLength(10, {
    message: 'Name max 10 char',
  })
  login: string;

  @IsEmail()
  @IsEmailExist({
    message: 'Email is already exist',
  })
  email: string;

  @IsString()
  @MinLength(6, {
    message: 'Password min 6 char',
  })
  @MaxLength(20, {
    message: 'Password max 20 char',
  })
  password: string;
}
