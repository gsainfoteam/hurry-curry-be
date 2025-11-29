// dto/req/refreshToken.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJ1dWlkIjoiMTIzNDU2NzgiLCJpYXQiOjE2MzI0ODQwMDAsImV4cCI6MTYzMzA4ODgwMH0.signature',
    description: 'JWT refresh token',
  })
  refreshToken: string;
}
