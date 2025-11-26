// src/orders/dto/create-order.dto.ts

// class-validator는 유효성 검사를 위해 사용되지만, 지금은 간단하게 타입만 정의합니다.
export class CreateOrderDto {
  /**
   * 1번 치킨 카레 개수 (예시)
   */
  curry1Count: number;

  /**
   * 2번 비건 카레 개수 (예시)
   */
  curry2Count: number;

  /**
   * 3번 포크 카레 개수 (예시)
   */
  curry3Count: number;

  /**
   * 난(Naan) 추가 개수
   */
  naanCount: number;
}
