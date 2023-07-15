import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';

@ValidatorConstraint({ name: 'IsConfirmationCodeValid', async: true })
@Injectable()
export class IsConfirmationCodeValidConstraint
  implements ValidatorConstraintInterface
{
  constructor(private readonly usersRepository: UsersRepository) {}

  async validate(code: string) {
    const user = await this.usersRepository.findByConfirmationCode(code);

    if (!user) {
      return false;
    }

    const currentDateTime = new Date();
    const expirationDate = user.emailConfirmation.expirationDate;

    const isConfirmed = user.emailConfirmation.isConfirmed;

    return expirationDate! > currentDateTime && !isConfirmed;
  }
}

export function IsConfirmationCodeValid(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isConfirmationCodeValid',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsConfirmationCodeValidConstraint,
    });
  };
}
