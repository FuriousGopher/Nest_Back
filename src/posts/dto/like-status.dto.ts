import { IsString, IsNotEmpty } from 'class-validator';

export class LikesDto {
  @IsNotEmpty()
  @IsString()
  likeStatus: string;
}
