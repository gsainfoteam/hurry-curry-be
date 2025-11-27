import { Controller, Get, Post, Body, Delete } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 주문 생성 API (POST /orders)
  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    // 사용자 ID는 지금은 임시로 1로 고정 (단일 사용자 제한)
    const userId = 1;

    // Service의 핵심 로직 호출
    const newOrder = await this.ordersService.create(createOrderDto, userId);

    // 앱에게 성공 응답을 돌려줌. (결제 완료 메시지 포함)
    return {
      message: '결제 완료되었습니다.', // 앱 화면에 표시될 메시지
      orderId: newOrder.id,
      estimatedPickupTime: newOrder.pickupTime.toISOString(), // ISO 형식으로 시간 전달
      totalQuantity: newOrder.quantity,
    };
  }

  // 2. 대기 상태 조회 API (READ)
  // 앱의 첫 화면에서 '대기 건수'를 보여주기 위해 사용
  @Get('status') // GET /orders/status 엔드포인트
  async getOrderStatus() {
    // Service를 호출하여 현재 대기 중인 주문 건수를 가져옴.
    const count = await this.ordersService.getActiveOrderCount();

    // 앱에게 응답
    return {
      activeOrderCount: count, // 현재 대기열에 있는 주문 건수
      message: `현재 ${count}개의 카레 주문 건이 대기열에 있습니다.`,
    };
  }
}

/*
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  } */
