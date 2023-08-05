export class UserQueryParamsDto {
  searchEmailTerm: string | null;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC' = 'DESC';
  pageNumber: number;
  pageSize: number;
  searchLoginTerm: string;
  banStatus: boolean | string;
}
