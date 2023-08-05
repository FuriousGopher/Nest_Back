import { BanStatus } from '../../enums/ban-status.enum';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class UserQueryParamsDto {
  searchEmailTerm: string | null;
  sortBy: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'asc') {
      return 'ASC';
    }
    if (value === 'desc') {
      return 'DESC';
    } else {
      return 'DESC';
    }
  })
  sortDirection: any;

  pageNumber: number;
  pageSize: number;
  searchLoginTerm: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === BanStatus.Banned) {
      return true;
    }
    if (value === BanStatus.NotBanned) {
      return false;
    }
  })
  banStatus: boolean | string;
}
