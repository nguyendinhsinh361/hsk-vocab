import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  });
  // Phục vụ file tĩnh (audio/image) tại /static. PROD đặt ASSETS_DIR=/app/assets
  // vì compiled main là dist/src/main.js (join(__dirname,'..','assets') sẽ sai).
  app.useStaticAssets(
    process.env.ASSETS_DIR ?? join(__dirname, '..', '..', 'assets'),
    { prefix: '/static' },
  );
  app.setGlobalPrefix('api');
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}/api`);
}
bootstrap().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
