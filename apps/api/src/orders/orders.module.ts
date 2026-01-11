import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrdersController } from './orders.controller';
import { CURRY_QUEUE } from '../../../../libs/common/src/constants';
import { OrdersRepository } from '../../../../libs/orders/src/orders.repository';
import { OrdersGateway } from './orders.gateway';
import { PrismaModule } from '../../../../libs/prisma/src/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { OrdersQueueEventsService } from './orders.queue-events';

@Module({
  imports: [
    BullModule.registerQueue({
      name: CURRY_QUEUE,
    }),
    PrismaModule,
    AuthModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersRepository, OrdersGateway, OrdersQueueEventsService],
})
export class OrdersModule {}
