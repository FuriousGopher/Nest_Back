import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserInputModelType } from './users.controller';
import { User, UserDocument } from '../schemas/users.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    protected userRepository: UsersRepository,
  ) {}
  findUsers(id: string) {
    this.userRepository.findUsers(id);
  }

  createUser(createUserDto: CreateUserInputModelType) {
    const createdUser = new this.userModel(createUserDto);
    createdUser.save();
    return {
      name: createdUser.name,
      age: createdUser.age,
    };
  }
}
