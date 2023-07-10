export class BlogsQueryParamsDto {
  searchNameTerm = '';
  sortBy = 'createdAt';
  sortDirection = 'desc';
  pageNumber = 1;
  pageSize = 10;
}
