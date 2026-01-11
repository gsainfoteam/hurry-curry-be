import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(WorkerModule);
  const logger = new Logger('WorkerBootstrap');
  logger.log('Worker started');
}

bootstrap();
