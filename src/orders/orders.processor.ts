import { Logger } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { CURRY_QUEUE, JOB_PROCESS_ORDER } from 'src/common/constants';
import { Job } from 'bullmq';

@Processor(CURRY_QUEUE)
export class OrdersProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(private readonly ordersRepository: OrdersRepository) {
    super();
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case JOB_PROCESS_ORDER:
        this.logger.log(`Processing Order Job: ${job.id}`);
        return this.ordersRepository.processOrderTransaction(job.data);
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }
}
