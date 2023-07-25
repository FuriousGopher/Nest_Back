import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from '@nestjs/class-validator';

export class CreateUserDto {
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

  @IsString()
  @MinLength(6, {
    message: 'Password min 6 char',
  })
  @MaxLength(20, {
    message: 'Password max 20 char',
  })
  password: string;
  @IsEmail()
  email: string;
}
