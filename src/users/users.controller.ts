import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserQueryParamsDto } from './dto/userQueryParams.dto';

@Controller('users')
export class UsersController {
  constructor(protected userService: UsersService) {}
  @Get()
  getUsers(@Query() queryParams: UserQueryParamsDto) {
    return this.userService.getAllUsers(queryParams);
  }
  @Post()
  createUser(@Body() inputModel: CreateUserDto) {
    return this.userService.createUser(inputModel);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
