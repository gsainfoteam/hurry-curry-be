import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { OrdersGateway } from './orders.gateway';
import { CURRY_QUEUE, JOB_PROCESS_ORDER } from '../common/constants';
import { OrdersRepository } from './orders.repository';
import { Order } from '@prisma/client';

@Processor(CURRY_QUEUE)
export class OrdersProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly ordersGateway: OrdersGateway,
  ) {
    super();
  }

  async process(job: Job): Promise<Order> {
    switch (job.name) {
      case JOB_PROCESS_ORDER:
        this.logger.log(`Processing Job ${job.id}`);

        try {
          const order = await this.ordersRepository.processOrderTransaction(
            job.data,
          );

          const kstPickupTime = order.pickupTime.toLocaleString('en-US', {
            timeZone: 'Asia/Seoul',
            hour12: false,
          });

          const message = {
            orderId: order.id,
            pickupTime: kstPickupTime,
            status: 'CONFIRMED',
          };

          this.ordersGateway.notifyUser(
            order.userId,
            'order_confirmed',
            message,
          );

          return order;
        } catch (error) {
          this.logger.error(`Job failed: ${error.message}`);
          throw error;
        }
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }
}
