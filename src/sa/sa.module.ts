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
import { CqrsModule } from '@nestjs/cqrs';
import { UserCreateUseCase } from '../auth/application/use-cases/user-create.use-case';
import { UserBanByBlogger } from '../auth/entities/user-ban-by-blogger.entity';
import { UserEmailConfirmation } from '../auth/entities/user-email-confirmation.entity';
import { UserPasswordRecovery } from '../auth/entities/user-password-recovery.entity';
import { UserBanBySA } from '../auth/entities/user-ban-by-sa.entity';
import { BlogBindUseCase } from './use-cases/blog-bind.use-case';
import { BlogBanUseCase } from './use-cases/blog-ban.use-case';

const strategies = [BasicStrategy];

const entities = [
  User,
  UserEmailConfirmation,
  UserPasswordRecovery,
  UserBanBySA,
  UserBanByBlogger,
];

const useCases = [UserCreateUseCase, BlogBindUseCase, BlogBanUseCase];
@Module({
  imports: [
    CqrsModule,
    BlogsModule,
    MongooseModule.forFeature([{ name: UserMongo.name, schema: UserSchema }]),
    TypeOrmModule.forFeature([...entities]),
  ],
  controllers: [SaController],
  providers: [SaService, SaRepository, ...strategies, ...useCases],
  exports: [SaRepository],
})
export class SaModule {}
