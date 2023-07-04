export class UserQueryParamsDto {
  sortBy = 'createdAt';
  sortDirection = 'desc';
  pageNumber = 1;
  pageSize = 10;
  searchLoginTerm: string = null;
  searchEmailTerm: string = null;
}
