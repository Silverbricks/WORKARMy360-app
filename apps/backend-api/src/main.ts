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
  // env parses CORS_ORIGINS (comma-separated) into a trimmed string[], so each
  // origin is matched individually (a single joined string never matches a real
  // Origin header). Pass the array straight through.
  app.enableCors({ origin: env.CORS_ORIGINS, credentials: true });
  app.useGlobalFilters(new HttpExceptionFilter());

  // Railway / Cloud Run inject PORT; fall back to the configured API_PORT locally.
  const port = Number(process.env.PORT) || env.API_PORT;
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`backend-api ready on :${port}/${env.API_GLOBAL_PREFIX}`);
}

void bootstrap();
