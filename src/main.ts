import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // await app.listen(8080);
  // app.enableCors();
  app.enableCors({
    origin: 'http://localhost:3000', // Cho phép yêu cầu từ frontend
    methods: 'GET,POST,PUT,DELETE', // Các phương thức HTTP được cho phép
    allowedHeaders: 'Content-Type,Authorization', // Các tiêu đề được cho phép
    credentials: true, // Cho phép gửi cookies qua các yêu cầu CORS
  });

  await app.listen(8080);
  // app.useGlobalPipes(
  //   new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  // );
  // app.get(ConfigService);
}
bootstrap();
