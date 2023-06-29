import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(protected userRepository: UsersRepository) {}
  findUsers(id: string) {
    this.userRepository.findUsers(id);
  }
}
