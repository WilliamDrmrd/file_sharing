import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // Configure CORS
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'https://file-sharing-front-only.vercel.app',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Accept', 'ngrok-skip-browser-warning'],
    credentials: true, // Optional, if you use cookies or auth
  });

  // Serve static assets with custom CORS headers
  app.useStaticAssets(join(__dirname, '..', 'Uploads'), {
    prefix: '/uploads/',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
      res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'ngrok-skip-browser-warning',
      );
      // Set permissive CSP to avoid image loading issues
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; img-src 'self' https://*.ngrok-free.app data:;",
      );
    },
  });

  await app.listen(3000);
}
bootstrap();
