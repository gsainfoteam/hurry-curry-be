import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GatewayResponseDto {
  @IsInt()
  @IsNotEmpty()
  orderId: number;

  @IsString()
  @IsOptional()
  pickupTime?: string;

  @IsNotEmpty()
  @IsString()
  status: string;

  @IsString()
  @IsOptional()
  message?: string;
}
