import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const uploadDirs = ['uploads/recipes', 'uploads/avatars'];
  uploadDirs.forEach((dir) => {
    const path = join(process.cwd(), dir);
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
      logger.log(`✅ Created directory: ${path}`);
    } else {
      logger.log(`📁 Directory exists: ${path}`);
    }
  });

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Serve static files - Metode yang lebih baik
  const uploadsPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    index: false,
    maxAge: '1d',
  });

  logger.log(`📂 Serving static files from: ${uploadsPath}`);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 3850;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Recipe API running on port ${port}`);
  logger.log(`🌍 Access from network: http://0.0.0.0:${port}`);
  logger.log(`📁 Uploads URL: http://localhost:${port}/uploads/`);
  logger.log(
    `📸 Example recipe image: http://localhost:${port}/uploads/recipes/FILENAME.jpg`,
  );
  logger.log(
    `👤 Example avatar: http://localhost:${port}/uploads/avatars/FILENAME.jpg`,
  );
}

bootstrap();
