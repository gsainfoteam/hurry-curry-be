import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Patch,
  ParseIntPipe,
  Param,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CURRY_QUEUE, JOB_PROCESS_ORDER } from 'src/common/constants';
import { Queue } from 'bullmq';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersRepository } from './orders.repository';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import type { Request } from 'express';
import { OrderRoleGuard, RequiredRole } from './guard/role.guard';
import { Role } from '@prisma/client';

type AuthenticatedRequest = Request & {
  user: { uuid: string; email: string; [key: string]: any };
};

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    @InjectQueue(CURRY_QUEUE) private curryQueue: Queue,
    private readonly ordersRepository: OrdersRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Create a new order',
    description: 'New Order',
  })
  @ApiBody({
    type: CreateOrderDto,
    description: 'Order details to be processed',
    examples: {
      sample: {
        summary: 'Example order',
        description: 'Student ordering 2 curry and 3 naan',
        value: {
          curryQuantity: 2,
          naanQuantity: 3,
        },
      },
    },
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
  @UseGuards(JwtAuthGuard, OrderRoleGuard)
  @ApiBearerAuth()
  @RequiredRole(Role.STUDENT)
  async create(
    @Body() { curryQuantity, naanQuantity }: CreateOrderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const pickupTime = new Date();

    const job = await this.curryQueue.add(
      JOB_PROCESS_ORDER,
      {
        userId: req.user.uuid,
        curryQuantity,
        naanQuantity,
        pickupTime,
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
      status: 'PENDING',
    };
  }

  @Patch(':id/ready')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, OrderRoleGuard)
  @ApiBearerAuth()
  @RequiredRole(Role.ADMIN)
  @ApiOperation({
    summary: 'Mark order as ready for pickup',
    description: 'Updates order status to COMPLETED and notifies the customer.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Order ID',
    example: 123,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order is ready',
    schema: {
      example: {
        id: 123,
        userId: 'd9e4f6c4-1234-4a7f-8b62-9c3c8e8b1b2c',
        curryQuantity: 2,
        naanQuantity: 3,
        status: 'COMPLETED',
        pickupTime: '2024-01-15T11:30:00.000Z',
        createdAt: '2024-01-15T11:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Order is already marked as ready',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to update order',
  })
  async markReady(@Param('id', ParseIntPipe) id: number) {
    return this.ordersRepository.markReady(id);
  }

  @Get('completed')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, OrderRoleGuard)
  @ApiBearerAuth()
  @RequiredRole(Role.ADMIN)
  @ApiOperation({
    summary: 'Get all completed orders',
    description:
      'Returns a list of all orders with COMPLETED status. Admin use only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of completed orders',
    schema: {
      example: [
        {
          id: 123,
          userId: 'd9e4f6c4-1234-4a7f-8b62-9c3c8e8b1b2c',
          curryQuantity: 2,
          naanQuantity: 3,
          status: 'COMPLETED',
          pickupTime: '2024-01-15T11:30:00.000Z',
          createdAt: '2024-01-15T11:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to fetch orders',
  })
  async getCompletedOrders() {
    return await this.ordersRepository.getAllCompletedOrders();
  }

  @Get('processing')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, OrderRoleGuard)
  @ApiBearerAuth()
  @RequiredRole(Role.ADMIN)
  @ApiOperation({
    summary: 'Get all processing orders',
    description:
      'Returns a list of all orders with PROCESSING status. Admin use only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of processing orders',
    schema: {
      example: [
        {
          id: 123,
          userId: 'd9e4f6c4-1234-4a7f-8b62-9c3c8e8b1b2c',
          curryQuantity: 2,
          naanQuantity: 3,
          status: 'PROCESSING',
          pickupTime: '2024-01-15T11:30:00.000Z',
          createdAt: '2024-01-15T11:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to fetch orders',
  })
  async getProcessingOrders() {
    return await this.ordersRepository.getAllProcessingOrders();
  }

  @Get(':id/completed')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, OrderRoleGuard)
  @ApiBearerAuth()
  @RequiredRole(Role.STUDENT)
  @ApiOperation({
    summary: 'Get user completed orders',
    description:
      'Returns a list of all orders with COMPLETED status of a user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of completed orders of a user',
    schema: {
      example: [
        {
          id: 123,
          userId: 'd9e4f6c4-1234-4a7f-8b62-9c3c8e8b1b2c',
          curryQuantity: 2,
          naanQuantity: 3,
          status: 'COMPLETED',
          pickupTime: '2024-01-15T11:30:00.000Z',
          createdAt: '2024-01-15T11:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to fetch orders',
  })
  async getUserCompletedOrders(@Req() req: AuthenticatedRequest) {
    return await this.ordersRepository.getUserCompletedOrders(req.user.uuid);
  }

  @Get(':id/processing')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, OrderRoleGuard)
  @ApiBearerAuth()
  @RequiredRole(Role.STUDENT)
  @ApiOperation({
    summary: 'Get user processing orders',
    description:
      'Returns a list of all orders with PROCESSING status of a user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of processing orders of a user',
    schema: {
      example: [
        {
          id: 123,
          userId: 'd9e4f6c4-1234-4a7f-8b62-9c3c8e8b1b2c',
          curryQuantity: 2,
          naanQuantity: 3,
          status: 'PROCESSING',
          pickupTime: '2024-01-15T11:30:00.000Z',
          createdAt: '2024-01-15T11:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to fetch orders',
  })
  async getUserProcessingOrders(@Req() req: AuthenticatedRequest) {
    return await this.ordersRepository.getUserProcessingOrders(req.user.uuid);
  }
}
