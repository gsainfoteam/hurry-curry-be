import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('hurry-curry-be')
    .setDescription('hurry-curry-be')
    .setVersion('1.0')
    .addTag('Fall longckathon')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(3000, '0.0.0.0');

  console.log('http://localhost:3000/api');
}
bootstrap();
