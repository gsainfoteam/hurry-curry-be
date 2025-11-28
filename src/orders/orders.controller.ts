import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CURRY_QUEUE, JOB_PROCESS_ORDER } from 'src/common/constants';
import { Queue } from 'bullmq';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(@InjectQueue(CURRY_QUEUE) private curryQueue: Queue) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Create a new order',
    description: 'New Order',
  })
  @ApiBody({
    type: CreateOrderDto,
    description: 'Order details to be processed',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Order successfully queued for processing',
    schema: {
      example: {
        success: true,
        message: 'Order is on line',
        jobId: '1234567890',
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid order data provided',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to queue order',
  })
  async create(@Body() createOrderDto: CreateOrderDto) {
    const job = await this.curryQueue.add(
      JOB_PROCESS_ORDER,
      {
        ...createOrderDto,
        createdAt: new Date(),
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
      },
    );

    return {
      success: true,
      message: 'Order is on line',
      jobId: job.id,
      timestamp: new Date(),
    };
  }
}
