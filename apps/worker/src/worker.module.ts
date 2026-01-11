import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CURRY_QUEUE } from '@lib/common';
import { PrismaModule } from '@lib/prisma';
import { OrdersProcessor } from './orders.processor';
import { OrdersRepository } from '@lib/orders';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST'),
          port: parseInt(configService.getOrThrow<string>('REDIS_PORT'), 10),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: CURRY_QUEUE,
    }),
    PrismaModule,
  ],
  providers: [OrdersProcessor, OrdersRepository],
})
export class WorkerModule {}
