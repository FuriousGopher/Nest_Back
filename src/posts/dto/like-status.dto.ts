import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class LikesDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['Like', 'Dislike', 'None'])
  likeStatus: string;
}
