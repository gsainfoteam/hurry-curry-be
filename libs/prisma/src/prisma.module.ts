import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CustomConfigModule } from '@lib/custom-config';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
  imports: [CustomConfigModule],
})
export class PrismaModule {}
