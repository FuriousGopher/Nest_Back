import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(protected userService: UsersService) {}
  @Get()
  getUsers() {
    return [{ id: 1 }, { age: 5 }];
  }
  @Post()
  createUser(@Body() inputModel: CreateUserInputModelType) {
    return this.userService.createUser(inputModel);
  }
  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.userService.findUsers(id);
  }
}

export type CreateUserInputModelType = {
  name: string;
  age: number;
};
