import { Transform } from 'class-transformer';

export class BannedUsersQueryParamsDto {
  searchLoginTerm: string;
  sortBy: string;

  @Transform(({ value }) => {
    if (value.toLowerCase() === 'asc') {
      return 'ASC';
    } else {
      return 'DESC';
    }
  })
  sortDirection: 'DESC';

  pageNumber: number;
  pageSize: number;
}
