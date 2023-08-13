import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class BlogsQueryParamsDto {
  searchNameTerm: string | null;
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
}
