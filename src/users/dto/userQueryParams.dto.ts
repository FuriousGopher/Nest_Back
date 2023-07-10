export class UserQueryParamsDto {
  sortBy = 'createdAt';
  sortDirection = 'desc';
  pageNumber = 1;
  pageSize = 10;
  searchLoginTerm = null;
  searchEmailTerm = null;
}
