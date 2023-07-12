/*
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../api/infrastructure/repositories/users/users.repository';

@ValidatorConstraint({ name: 'IsEmailExist', async: true })
@Injectable()
export class IsEmailExistConstraint implements ValidatorConstraintInterface {
  constructor(private readonly usersRepository: UsersRepository) {}
  async validate(email: string) {
    const user = await this.usersRepository.checkEmail(email);
    return !user;
  }
}

export const IsEmailExist =
  (validationOptions?: ValidationOptions) =>
  (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmailExistConstraint,
    });
  };
*/
