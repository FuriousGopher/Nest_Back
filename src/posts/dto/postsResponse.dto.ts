import { ViewPostDto } from './view-post.dto';

export class PostsResponseDto {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: ViewPostDto[];
}
