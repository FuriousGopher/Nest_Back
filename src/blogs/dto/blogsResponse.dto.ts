import { ViewBlogDto } from './view-blog.dto';

export class BlogsResponseDto {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: ViewBlogDto[];
}
