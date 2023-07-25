/*
`/!*
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { SaRepository } from '../sa/sa.repository';
import { BadRequestException } from '@nestjs/common';
import {
  confirmCodeField,
  confirmCodeIsIncorrect,
} from '../exceptions/exception.constants';
import { ResultCode } from '../enums/result-code.enum';
import { exceptionHandler } from '../exceptions/exception.handler';

@ValidatorConstraint({ name: 'IsConfirmationCodeValid', async: true })
export class IsConfirmationCodeValidConstraint
  implements ValidatorConstraintInterface
{
  constructor(private usersRepository: SaRepository) {
    console.log(this.usersRepository);
  }

  async validate(code: string): Promise<boolean> {
    const user = await this.usersRepository.findByConfirmationCode(code);

    if (!user) {
      throw new BadRequestException('Invalid confirmation code.');
    }

    const currentDateTime = new Date(); /!**!/
    const expirationDate = user.emailConfirmation.expirationDate;

    const isConfirmed = user.emailConfirmation.isConfirmed;

    if (expirationDate! > currentDateTime && !isConfirmed) {
      return exceptionHandler(
        ResultCode.BadRequest /!**!/,
        confirmCodeIsIncorrect,
        confirmCodeField,
      );
    }

    return exceptionHandler(
      ResultCode.BadRequest,
      confirmCodeIsIncorrect,/!**!/
      confirmCodeField,
    );
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
*!/
`*/
