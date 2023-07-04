export class BlogsQueryParamsDto {
  searchNameTerm: string = null;
  sortBy = 'createdAt';
  sortDirection = 'desc';
  pageNumber = 1;
  pageSize = 10;
}
