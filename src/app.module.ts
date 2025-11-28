import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersModule } from './orders/orders.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BullModule } from '@nestjs/bullmq';
import { CURRY_QUEUE } from './common/constants';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    OrdersModule,
    AuthModule,

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: await configService.get('REDIS_HOST'),
          port: parseInt(configService.get<string>('REDIS_PORT')!),
        },
      }),
      inject: [ConfigService],
    }),

    BullModule.registerQueue({
      name: CURRY_QUEUE,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
