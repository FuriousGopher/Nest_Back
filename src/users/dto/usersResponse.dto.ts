import { UserViewModelDto } from './userViewModel.dto';

export class UsersResponseDto {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: UserViewModelDto[];
}
