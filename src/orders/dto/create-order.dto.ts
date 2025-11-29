import { IsInt, Min, Max } from 'class-validator';

export class CreateOrderDto {
  @IsInt()
  @Min(0)
  @Max(10)
  curryQuantity: number;

  @IsInt()
  @Min(0)
  @Max(10)
  naanQuantity: number;
}
