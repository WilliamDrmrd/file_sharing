import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // Configure CORS
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'https://snapshare-ku.vercel.app',
      'https://snapshare.ramizz.xyz',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'ngrok-skip-browser-warning',
      'x-admin-token',
      // Added to support password-protected folders
      'x-folder-password',
    ],
    credentials: true, // Optional, if you use cookies or auth
  });
  await app.listen(3000);
}
void bootstrap();
