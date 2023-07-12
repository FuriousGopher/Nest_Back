import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { BasicStrategy } from './strategies/basic.strategy';
import { ThrottlerModule } from '@nestjs/throttler';

const strategies = [BasicStrategy];

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 10,
      limit: 5,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, ...strategies],
})
export class AuthModule {}
