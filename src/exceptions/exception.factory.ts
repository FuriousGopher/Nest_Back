import { BadRequestException } from '@nestjs/common'; // throttle.decorator.ts

import { exceptionObjectType } from './types/exception-object.type';

export const customExceptionFactory = (errors) => {
  const errorsForResponse: exceptionObjectType[] = [];

  errors.forEach((e) => {
    const constraintKeys = Object.keys(e.constraints);

    constraintKeys.forEach((key) => {
      errorsForResponse.push({
        message: e.constraints[key],
        field: e.property,
      });
    });
  });

  throw new BadRequestException(errorsForResponse);
};
