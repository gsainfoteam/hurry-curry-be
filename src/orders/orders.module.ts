import { Module } from '@nestjs/common';
import { OrdersProcessor } from './orders.processor';
import { BullModule } from '@nestjs/bullmq';
import { OrdersController } from './orders.controller';
import { CURRY_QUEUE } from 'src/common/constants';
import { OrdersRepository } from './orders.repository';
import { OrdersGateway } from './orders.gateway';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: CURRY_QUEUE,
    }),
    PrismaModule,
    AuthModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersProcessor, OrdersRepository, OrdersGateway],
})
export class OrdersModule {}
