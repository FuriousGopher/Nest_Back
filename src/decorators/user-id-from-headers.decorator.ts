import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserIdFromHeaders = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.userId;
  },
);
