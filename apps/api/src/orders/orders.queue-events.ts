import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { QueueEvents } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { OrdersGateway } from './orders.gateway';
import { CURRY_QUEUE } from '../../../../libs/common/src/constants';

type CompletedOrderPayload = {
  id: number;
  userId: string;
  pickupTime: string | Date;
  status: string;
};

@Injectable()
export class OrdersQueueEventsService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(OrdersQueueEventsService.name);
  private queueEvents?: QueueEvents;

  constructor(
    private readonly configService: ConfigService,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  async onModuleInit() {
    const hostValue = this.configService.get<string>('REDIS_HOST');
    const host =
      hostValue && hostValue.trim().length > 0 ? hostValue : 'localhost';
    const portValue = this.configService.get<string>('REDIS_PORT');
    const parsedPort = parseInt(portValue ?? '', 10);
    const port = Number.isNaN(parsedPort) ? 6379 : parsedPort;

    this.queueEvents = new QueueEvents(CURRY_QUEUE, {
      connection: {
        host,
        port,
      },
    });
    await this.queueEvents.waitUntilReady();

    this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
      const order = this.parseCompletedOrder(returnvalue);
      if (!order) {
        this.logger.warn(`Completed job ${jobId} returned no order payload`);
        return;
      }

      const pickupDate = new Date(order.pickupTime);
      const pickupTime = Number.isNaN(pickupDate.valueOf())
        ? String(order.pickupTime)
        : pickupDate.toLocaleString('en-US', {
            timeZone: this.configService.get('TIMEZONE') || 'Asia/Seoul',
            hour12: false,
          });

      try {
        this.ordersGateway.notifyUser(order.userId, 'order_confirmed', {
          orderId: order.id,
          pickupTime,
          status: order.status,
        });
      } catch (error) {
        this.logger.warn(`Failed to notify user ${order.userId}`, error);
      }
    });

    this.queueEvents.on('error', (error) => {
      this.logger.error('Queue events error', error);
    });
  }

  async onModuleDestroy() {
    await this.queueEvents?.close();
  }

  private parseCompletedOrder(
    returnvalue: unknown,
  ): CompletedOrderPayload | null {
    if (!returnvalue) return null;

    if (typeof returnvalue === 'string') {
      try {
        const parsed = JSON.parse(returnvalue);
        return this.isCompletedOrderPayload(parsed) ? parsed : null;
      } catch (error) {
        return null;
      }
    }

    if (typeof returnvalue === 'object') {
      return this.isCompletedOrderPayload(returnvalue) ? returnvalue : null;
    }

    return null;
  }

  private isCompletedOrderPayload(
    value: unknown,
  ): value is CompletedOrderPayload {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as CompletedOrderPayload;
    return (
      typeof candidate.id === 'number' &&
      typeof candidate.userId === 'string' &&
      typeof candidate.status === 'string' &&
      typeof candidate.pickupTime !== 'undefined'
    );
  }
}
