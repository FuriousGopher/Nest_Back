import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from '@nestjs/class-validator';

export class CreateUserDto {
  @IsString() //TODO check how its work error msg
  @Matches(/^[a-zA-Z0-9_-]*$/, {
    message:
      'the first character of the username must not be a number. Username must contains at least 4 characters',
  })
  @MinLength(3, {
    message: 'min 3',
  })
  @MaxLength(10, {
    message: 'max 10',
  })
  login: string;

  @IsString()
  @MinLength(6, {
    message: 'min 6',
  })
  @MaxLength(20, {
    message: 'max 20',
  })
  password: string;
  @IsEmail()
  email: string;
}
