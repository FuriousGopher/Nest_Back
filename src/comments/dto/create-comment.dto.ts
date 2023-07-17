import { IsNotEmpty, MaxLength, MinLength, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(300)
  @MinLength(20)
  content: string;
}
