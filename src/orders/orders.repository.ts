import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from '@prisma/client';
import { TruckState } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrdersRepository {
  private static readonly COOKING_TIME_PER_NAAN = 3 * 60 * 1000; // 3 minutes
  private static readonly POURING_TIME_PER_CURRY = 20 * 1000; // 20 seconds

  private readonly logger = new Logger(OrdersRepository.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async processOrderTransaction(data: CreateOrderDto): Promise<Order> {
    return await this.prismaService.$transaction(async (tx) => {
      await tx.truckState.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, endTime: new Date() },
      });

      const state = await tx.$queryRaw<TruckState[]>`
      SELECT * FROM "TruckState" WHERE id = 1 FOR UPDATE 
      `;
      let endTime = new Date();

      if (Array.isArray(state) && state.length > 0) {
        endTime = new Date(state[0].endTime);
      } else {
        await tx.truckState.upsert({
          where: { id: 1 },
          update: { endTime: new Date() },
          create: { id: 1, endTime: new Date() },
        });
      }

      const now = new Date();

      const startTime = endTime > now ? endTime : now;

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
          createdAt: now,
          pickupTime: pickupTime,
          status: 'CONFIRMED',
        },
      });

      this.logger.log(
        `Order ${newOrder.id} Scheduled for ${pickupTime.toLocaleString(
          'en-US',
          {
            timeZone: this.configService.get('TIMEZONE') || 'Asia/Seoul',
            hour12: false,
          },
        )}`,
      );

      return newOrder;
    });
  }
}
