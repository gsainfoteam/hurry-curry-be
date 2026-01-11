import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { CURRY_QUEUE, JOB_PROCESS_ORDER } from '@lib/common';
import { OrdersRepository } from '@lib/orders';
import { Order } from '@prisma/client';
import { IsInt, IsUUID, Max, Min, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';

class ProcessOrderJobDto {
  @IsUUID()
  userId: string;

  @IsInt()
  @Min(1)
  @Max(10)
  curryQuantity: number;

  @IsInt()
  @Min(1)
  @Max(10)
  naanQuantity: number;
}

@Processor(CURRY_QUEUE)
export class OrdersProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(
    private readonly ordersRepository: OrdersRepository,
  ) {
    super();
  }

  async process(job: Job): Promise<Order> {
    switch (job.name) {
      case JOB_PROCESS_ORDER:
        this.logger.log(`Processing Job ${job.id}`);

        try {
          const validated = plainToInstance(ProcessOrderJobDto, job.data);
          const errors = validateSync(validated, { whitelist: true });
          if (errors.length) {
            const reason = errors
              .map((e) => Object.values(e.constraints ?? {}).join(', '))
              .filter(Boolean)
              .join('; ');
            throw new Error(
              `Invalid job data: ${reason || 'validation failed'}`,
            );
          }

          const order = await this.ordersRepository.processOrderTransaction(
            {
              curryQuantity: validated.curryQuantity,
              naanQuantity: validated.naanQuantity,
            },
            validated.userId,
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
