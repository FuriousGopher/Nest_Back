import { Inject, Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { genSalt, hash } from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(UsersRepository)
    protected userRepository: UsersRepository,
  ) {}
  findUsers(id: string) {
    this.userRepository.findUsers(id);
  }

  getAllUsers(queryParams) {
    return this.userRepository.getAllUsers(queryParams);
  }

  async createUser(createUserDto: CreateUserDto) {
    const passwordSalt = await genSalt(10);
    const passwordHash = await hash(createUserDto.password, passwordSalt);
    const newUser = this.userRepository.createUser(createUserDto, passwordHash);
    return newUser;
  }

  async deleteUser(id: string) {
    return this.userRepository.deleteUser(id);
  }
}
