import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SaService } from './sa.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserQueryParamsDto } from './dto/userQueryParams.dto';
import { BasicAuthGuard } from '../auth/guards/basic-auth.guard';
import { exceptionHandler } from '../exceptions/exception.handler';
import { ResultCode } from '../enums/result-code.enum';
import { BanUserDto } from './dto/ban-user.dto';
import { BlogsQueryParamsDto } from '../blogs/dto/blogs-query-params.dto';
import { CommandBus } from '@nestjs/cqrs';
import { UserCreateCommand } from '../auth/application/use-cases/user-create.use-case';
import { SaRepository } from './sa.repository';

@UseGuards(BasicAuthGuard)
@Controller('sa')
export class SaController {
  constructor(
    protected saService: SaService,
    private commandBus: CommandBus,
    protected saRepository: SaRepository,
  ) {}

  ///Users
  @Get('users')
  async getUsers(@Query() queryParams: UserQueryParamsDto) {
    const result = await this.saService.getAllUsers(queryParams);
    if (!result) {
      return exceptionHandler(
        ResultCode.BadRequest,
        'An error occurred while getting users.',
        'users',
      );
    }
    return result;
  }

  @Post('users')
  async createUser(@Body() inputModel: CreateUserDto) {
    const userId = await this.commandBus.execute(
      new UserCreateCommand(inputModel),
    );
    return this.saRepository.findUserByIdMappedSQL(userId);
  }

  @HttpCode(204)
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    const deleted = await this.saService.deleteUser(id);
    if (!deleted) {
      return exceptionHandler(
        ResultCode.NotFound,
        `User with id ${id} not found`,
        'id',
      );
    }
  }
  @HttpCode(204)
  @Put('users/:id/ban')
  async banUser(@Param('id') id: string, @Body() banUserDto: BanUserDto) {
    const result = await this.saService.unBunUser(id, banUserDto);
    if (!result) {
      return exceptionHandler(
        ResultCode.NotFound,
        `User with id ${id} not found`,
        'id',
      );
    }
    return;
  }

  ///Blogs

  @HttpCode(204)
  @Put('blogs/:id/bind-with-user/:userId')
  async bindBlog(@Param('id') id: string, @Param('userId') userId: string) {
    const result = await this.saService.bindBlog(id, userId);
    if (!result) {
      return exceptionHandler(
        ResultCode.BadRequest,
        `Blog with id ${id} already bound with user`,
        'userId',
      );
    }
    return;
  }

  @Get('blogs')
  async getBlogs(@Query() queryParams: BlogsQueryParamsDto) {
    const result = await this.saService.findAllBlogsForSA(queryParams);
    if (!result) {
      return exceptionHandler(
        ResultCode.BadRequest,
        'An error occurred while getting blogs.',
        'blogs',
      );
    }
    return result;
  }

  @HttpCode(204)
  @Put('blogs/:id/ban')
  async banBlog(@Param('id') id: string, @Body() banUserDto: BanUserDto) {
    const result = await this.saService.banBlog(id, banUserDto);
    if (!result) {
      return exceptionHandler(
        ResultCode.BadRequest,
        `Blog with id ${id} not found`,
        'blog id',
      );
    }
    return;
  }
}
