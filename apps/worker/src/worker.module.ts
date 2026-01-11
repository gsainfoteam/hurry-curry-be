import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CURRY_QUEUE } from '../../../libs/common/src/constants';
import { PrismaModule } from '../../../libs/prisma/src/prisma.module';
import { OrdersProcessor } from './orders.processor';
import { OrdersRepository } from '../../../libs/orders/src/orders.repository';

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
