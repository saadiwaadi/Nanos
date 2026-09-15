import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // whitelist: strips unknown props from bodies (mass-assignment guard);
  // transform: payloads become DTO class instances for class-validator.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  app.use(cookieParser());
  const isProd = process.env.NODE_ENV === 'production';
  const webOrigin = process.env.WEB_ORIGIN || (!isProd ? 'http://localhost:3000' : '');
  const adminOrigin = process.env.ADMIN_ORIGIN || (!isProd ? 'http://localhost:3001' : '');

  if (isProd && (!process.env.WEB_ORIGIN || !process.env.ADMIN_ORIGIN)) {
    throw new Error('WEB_ORIGIN and ADMIN_ORIGIN environment variables must be defined in production');
  }

  app.enableCors({
    origin: [webOrigin, adminOrigin].filter(Boolean),
    credentials: true,
  });
  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`API ready on port ${port}`);
}
await bootstrap();
