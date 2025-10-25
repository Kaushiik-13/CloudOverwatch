import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // ✅ Enable global validation for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ✅ CORS setup for frontend
  app.enableCors({
    origin: ['http://localhost:3001'], // your Next.js frontend port
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
  });

  // ✅ Optional global prefix for clarity
  app.setGlobalPrefix('api');

  // ✅ Swagger setup
  const config = new DocumentBuilder()
    .setTitle('CloudOverwatch API')
    .setDescription('API documentation for CloudOverwatch platform')
    .setVersion('1.0')
    .addTag('Auth', 'User authentication endpoints')
    .addTag('AWS', 'AWS Lambda integration endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log(`🚀 Server running at: http://localhost:3000`);
  console.log(`📘 Swagger docs at: http://localhost:3000/api/docs`);
}
bootstrap();
