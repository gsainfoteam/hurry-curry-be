import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class GatewayResponseDto {
  @IsInt()
  @IsNotEmpty()
  orderId: number;

  @IsString()
  @IsNotEmpty()
  pickupTime?: string;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsString()
  @IsNotEmpty()
  message?: string;
}
