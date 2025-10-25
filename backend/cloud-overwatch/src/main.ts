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
    origin: ['https://cloud-overwatch.vercel.app'], // frontend
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
  });

  // ✅ Optional global prefix
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

  // ✅ Listen on Vercel’s dynamic port
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server running at: http://localhost:${port}`);
  console.log(`📘 Swagger docs at: http://localhost:${port}/api/docs`);
}
bootstrap();
