import { Inject, Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { genSalt, hash } from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(UsersRepository)
    protected userRepository: UsersRepository,
  ) {}

  getAllUsers(queryParams) {
    return this.userRepository.getAllUsers(queryParams);
  }

  async createUser(createUserDto: CreateUserDto) {
    try {
      const passwordSalt = await genSalt(10);
      const passwordHash = await hash(createUserDto.password, passwordSalt);
      const newUser = await this.userRepository.createUserBySA(
        createUserDto,
        passwordHash,
      );
      return newUser;
    } catch (error) {
      console.error('An error occurred while creating a password:', error);

      return {
        success: false,
        message: 'An error occurred while creating a password.',
      };
    }
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.findOne(id);
    if (user) {
      return await this.userRepository.deleteUser(id);
    }
    return false;
  }
}
