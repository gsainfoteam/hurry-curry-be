import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CustomConfigModule } from '../../custom-config/src/custom-config.module';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
  imports: [CustomConfigModule],
})
export class PrismaModule {}
