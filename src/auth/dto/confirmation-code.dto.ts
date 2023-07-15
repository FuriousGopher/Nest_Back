import { IsNotEmpty } from 'class-validator';
import { IsString } from '@nestjs/class-validator';
import { IsConfirmationCodeValid } from '../../decorators/check-confirmation-code.decorator';

export class ConfirmationCodeDto {
  @IsString()
  @IsNotEmpty()
  @IsConfirmationCodeValid()
  code: string;
}
