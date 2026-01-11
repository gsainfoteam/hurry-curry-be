import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsUUID } from 'class-validator';

export class PayloadDto {
  @IsString()
  @IsUUID()
  @ApiProperty({
    example: '123456789',
  })
  uuid: string;

  @IsString()
  @IsEmail()
  @ApiProperty({
    example: 'abc@gm.gist.ac.kr',
  })
  email: string;
}
