import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrdersController } from './orders.controller';
import { CURRY_QUEUE } from '@app/common';
import { OrdersRepository } from '@app/orders';
import { OrdersGateway } from '@app/api/orders/orders.gateway';
import { OrdersQueueEventsService } from '@app/api/orders/orders.queue-events';
import { PrismaModule } from '@app/prisma';
import { AuthModule } from '@app/api/auth/auth.module';

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
