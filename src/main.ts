import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import cookieParser from 'cookie-parser';
import { TrimPipe } from './pipes/trim.pipe';
import { customExceptionFactory } from './exceptions/exception.factory';
import { HttpExceptionFilter } from './exceptions/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.enableCors();
  app.use(cookieParser());
  app.useGlobalPipes(
    new TrimPipe(),
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: customExceptionFactory,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(3004);
}
bootstrap();
