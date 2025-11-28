import { Module } from '@nestjs/common';
import { OrdersProcessor } from './orders.processor';
import { BullModule } from '@nestjs/bullmq';
import { OrdersController } from './orders.controller';
import { CURRY_QUEUE } from 'src/common/constants';
import { OrdersRepository } from './orders.repository';
import { OrdersGateway } from './orders.gateway';

@Module({
  imports: [
    BullModule.registerQueue({
      name: CURRY_QUEUE,
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersProcessor, OrdersRepository, OrdersGateway],
})
export class OrdersModule {}
