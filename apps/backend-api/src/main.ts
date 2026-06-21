import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix(env.API_GLOBAL_PREFIX);
  app.enableCors({ origin: env.CORS_ORIGINS, credentials: true });
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(env.API_PORT);
  new Logger('Bootstrap').log(
    `backend-api ready on http://localhost:${env.API_PORT}/${env.API_GLOBAL_PREFIX}`,
  );
}

void bootstrap();
