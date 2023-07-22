import { SetMetadata } from '@nestjs/common';

export const THROTTLE_LOGIN_KEY = 'throttle_login';
export const ThrottleLogin = (limit: number, timeWindow: number) =>
  SetMetadata(THROTTLE_LOGIN_KEY, { limit, timeWindow });
