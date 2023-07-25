import { Module } from '@nestjs/common';
import { SaController } from './sa.controller';
import { SaService } from './sa.service';
import { SaRepository } from './sa.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../db/schemas/users.schema';
import { BasicStrategy } from '../auth/strategies/basic.strategy';
import { BlogsModule } from '../blogs/blogs.module';

const strategies = [BasicStrategy];

@Module({
  imports: [
    BlogsModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [SaController],
  providers: [SaService, SaRepository, ...strategies],
  exports: [SaRepository],
})
export class SaModule {}
