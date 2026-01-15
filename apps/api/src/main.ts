import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);
  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const nodeEnv = process.env.NODE_ENV ?? '';
  const isProduction = nodeEnv.toLowerCase() === 'production';
  let allowedOrigins: string[];
  if (origins.length > 0) {
    allowedOrigins = origins;
  } else if (isProduction) {
    throw new Error('CORS_ORIGINS must be set in production');
  } else {
    allowedOrigins = ['http://localhost:3000', 'http://localhost:5173'];
  }
  const allowCredentialsValue = process.env.CORS_ALLOW_CREDENTIALS ?? '';
  const allowCredentials = ['1', 'true'].includes(
    allowCredentialsValue.trim().toLowerCase(),
  );

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: allowCredentials,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('hurry-curry-be')
    .setDescription('hurry-curry-be')
    .setVersion('1.0')
    .addTag('Fall longckathon')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  const portValue = process.env.PORT;
  const parsedPort = parseInt(portValue ?? '', 10);
  const port = Number.isNaN(parsedPort) || parsedPort <= 0 ? 3000 : parsedPort;
  await app.listen(port, '0.0.0.0');

  const url = await app.getUrl();
  console.log(`${url}/api`);
}
void bootstrap().catch((error) => {
  console.error('Failed to bootstrap API', error);
  process.exit(1);
});
