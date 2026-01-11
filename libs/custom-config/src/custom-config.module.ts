import { ConfigModule } from '@nestjs/config';
import { CustomConfigService } from './custom-config.service';
import { Module } from '@nestjs/common';
import { validate } from './env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      ignoreEnvFile: false,
      validate,
    }),
  ],
  providers: [CustomConfigService],
  exports: [CustomConfigService],
})
export class CustomConfigModule {}
