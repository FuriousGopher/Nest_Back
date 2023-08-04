import { Module } from '@nestjs/common';
import { SaController } from './sa.controller';
import { SaService } from './sa.service';
import { SaRepository } from './sa.repository';
import { BasicStrategy } from '../auth/strategies/basic.strategy';
import { BlogsModule } from '../blogs/blogs.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { UserMongo, UserSchema } from '../db/schemas/users.schema';

const strategies = [BasicStrategy];

@Module({
  imports: [
    BlogsModule,
    MongooseModule.forFeature([{ name: UserMongo.name, schema: UserSchema }]),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [SaController],
  providers: [SaService, SaRepository, ...strategies],
  exports: [SaRepository],
})
export class SaModule {}
