import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

// 임시 데이터 저장소 (DB 연동 전까지 현재 주문 상태를 기억합니다.)
// Temporary Data Storage (It remembers the current order status until it is integrated with the DB.)
let mockOrderQueue: { id: number; pickupTime: Date; status: string }[] = [];

@Injectable()
export class OrdersService {
  // 1. 주문 생성 로직 (CREATE)
  async create(createOrderDto: CreateOrderDto, userId: number) {
    // 총 주문 수량 계산
    const totalQuantity =
      (createOrderDto.curry1Count || 0) +
      (createOrderDto.curry2Count || 0) +
      (createOrderDto.curry3Count || 0) +
      (createOrderDto.naanCount || 0);

    // 마지막 주문 종료 시간 가져오기 (DB 담당자의 역할이지만 임시 함수 사용)
    const lastOrderEndTime: Date = await this.getLastOrderEndTime(); 
    
    // pickupTime 계산 (핵심 로직: Time = max(current_time, last_order_end_time) + quantity*3min)
    const now = new Date();
    // 현재 시간과 마지막 주문 종료 시간 중 더 늦은 시간을 시작 시간으로 잡음.
    const startTime = (now > lastOrderEndTime) ? now : lastOrderEndTime; 
    
    // 픽업 시간을 계산 (totalQuantity * 3분)
    // Date.getTime()은 밀리초(ms) 단위이므로 3 * 60000 (ms)를 곱함.
    const pickupTime = new Date(startTime.getTime() + totalQuantity * 3 * 60000);

    // DB 담당자에게 전달할 데이터 (현재는 임시 큐에 저장)
    const orderToSave = {
      id: mockOrderQueue.length + 1,
      userId,
      quantity: totalQuantity,
      pickupTime, // 계산된 픽업 시간
      status: 'Confirmed', // 초기 상태
    };

    // [DB 담당자 역할]: 이 데이터를 DB에 저장하는 함수를 호출해야 함.
    mockOrderQueue.push(orderToSave); // 임시 저장

    return orderToSave;
  }
// 2. 주문 건수 조회 로직 (READ)
  async getActiveOrderCount(): Promise<number> {
      // [DB 담당자 역할]: DB에서 'PREPARING' 또는 'CONFIRMED' 상태의 주문 건수를 조회해야 함.
      return mockOrderQueue.length; // 임시 큐의 크기를 반환
  }

  // 임시: 마지막 주문 종료 시간을 반환하는 함수 (DB 담당자의 함수를 가정)
  private async getLastOrderEndTime(): Promise<Date> {
      if (mockOrderQueue.length === 0) {
          // 큐가 비었다면 현재 시간을 반환
          return new Date(); 
      }
      // 큐에 있는 마지막 주문의 픽업 시간을 반환
      return mockOrderQueue[mockOrderQueue.length - 1].pickupTime; 
  }

  findAll() {
    return `This action returns all orders`;
  }






  /*findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  } */
}
  