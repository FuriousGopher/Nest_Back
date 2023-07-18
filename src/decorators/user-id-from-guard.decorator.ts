import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserIdFromGuard = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user.userId;
  },
);
