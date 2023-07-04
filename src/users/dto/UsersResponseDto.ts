import { UserViewModel } from './userViewModel';

export class UsersResponseDto {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: UserViewModel[];
}
