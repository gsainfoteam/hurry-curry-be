import { IsInt, IsUUID, Min, Max } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  userId: string;

  @IsInt()
  @Min(0)
  @Max(10)
  curryQuantity: number;

  @IsInt()
  @Min(0)
  @Max(10)
  naanQuantity: number;
}
