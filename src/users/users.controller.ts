import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
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
    return [{ id: uuidv4(), name: inputModel.name, age: inputModel.age }];
  }
  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.userService.findUsers(id);
  }
}

type CreateUserInputModelType = {
  name: string;
  age: number;
};
