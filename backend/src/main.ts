import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // Enable CORS
  app.enableCors();

  // Apply global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that are not in the DTO
      transform: true, // Transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw errors when non-whitelisted properties are present
    }),
  );

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Configure Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Online Bookstore API')
    .setDescription('API documentation for the Online Bookstore application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Start the server
  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}`);
}
bootstrap();
