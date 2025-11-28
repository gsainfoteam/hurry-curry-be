import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from '@prisma/client';

@Injectable()
export class OrdersRepository {
  private static readonly COOKING_TIME_PER_NAAN = 3 * 60 * 1000; // 3 minutes
  private static readonly POURING_TIME_PER_CURRY = 20 * 1000; // 20 seconds

  private readonly logger = new Logger(OrdersRepository.name);

  constructor(private readonly prismaService: PrismaService) {}

  async processOrderTransaction(data: CreateOrderDto): Promise<Order> {
    return await this.prismaService.$transaction(async (tx) => {
      let state = await tx.truckState.findUnique({ where: { id: 1 } });

      if (!state) {
        state = await tx.truckState.create({
          data: { id: 1, endTime: new Date() },
        });
      }

      const now = new Date();
      const lastOrderTime = new Date(state.endTime);

      const startTime = lastOrderTime > now ? lastOrderTime : now;

      const totalDuration =
        data.naanQuantity * OrdersRepository.COOKING_TIME_PER_NAAN +
        data.curryQuantity * OrdersRepository.POURING_TIME_PER_CURRY;

      const pickupTime = new Date(startTime.getTime() + totalDuration);

      await tx.truckState.update({
        where: { id: 1 },
        data: { endTime: pickupTime },
      });

      const newOrder = await tx.order.create({
        data: {
          userId: data.userId,
          curryQuantity: data.curryQuantity,
          naanQuantity: data.naanQuantity,
          pickupTime: pickupTime,
          status: 'CONFIRMED',
        },
      });

      this.logger.log(
        `Order ${newOrder.id} Scheduled for ${pickupTime.toISOString()}`,
      );

      return newOrder;
    });
  }
}
