import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class BlogsQueryParamsDto {
  searchNameTerm = '';
  sortBy = 'createdAt';

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

  pageNumber = 1;
  pageSize = 10;
}
