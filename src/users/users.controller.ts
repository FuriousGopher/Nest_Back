import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
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
  async getUsers(@Query() queryParams: UserQueryParamsDto) {
    const result = await this.userService.getAllUsers(queryParams);
    if (!result) {
      return {
        success: false,
        message: 'An error occurred while getting users.',
      };
    }
    return result;
  }
  @Post()
  createUser(@Body() inputModel: CreateUserDto) {
    return this.userService.createUser(inputModel);
  }
  @HttpCode(204)
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    const deleted = await this.userService.deleteUser(id);
    if (!deleted) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }
}
