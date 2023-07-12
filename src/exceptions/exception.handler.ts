import { ResultCode } from '../enums/result-code.enum';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

export const exceptionHandler = (
  code: ResultCode,
  message?: string,
  field?: string,
) => {
  const exceptionObject = {
    message: [
      {
        message: message,
        field: field,
      },
    ],
  };

  switch (code) {
    case ResultCode.BadRequest: {
      throw new BadRequestException(exceptionObject);
    }
    case ResultCode.NotFound: {
      throw new NotFoundException(exceptionObject);
    }
    case ResultCode.Forbidden: {
      throw new ForbiddenException(exceptionObject);
    }
  }
};
