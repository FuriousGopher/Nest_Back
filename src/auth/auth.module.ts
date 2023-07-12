import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { BasicStrategy } from './strategies/basic.strategy';

const strategies = [BasicStrategy];

@Module({
  controllers: [AuthController],
  providers: [AuthService, ...strategies],
})
export class AuthModule {}
