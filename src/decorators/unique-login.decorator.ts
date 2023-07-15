import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';

@ValidatorConstraint({ name: 'IsLoginExist', async: true })
@Injectable()
export class IsLoginExistConstraint implements ValidatorConstraintInterface {
  constructor(private readonly usersRepository: UsersRepository) {}
  async validate(login: string) {
    const user = await this.usersRepository.checkLogin(login);
    return !user;
  }
}

export const IsLoginExist =
  (validationOptions?: ValidationOptions) =>
  (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsLoginExistConstraint,
    });
  };
