import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariableKeys } from './env.validation';

@Injectable()
export class CustomConfigService {
  constructor(private configService: ConfigService) {}

  private getEnvVariable(key: EnvironmentVariableKeys) {
    return this.configService.getOrThrow(key);
  }

  get DATABASE_URL(): string {
    return this.getEnvVariable('DATABASE_URL');
  }

  get DATABASE_USER(): string {
    return this.getEnvVariable('DATABASE_USER');
  }

  get REDIS_PORT(): number {
    return this.getEnvVariable('REDIS_PORT');
  }

  get JWT_SECRET(): string {
    return this.getEnvVariable('JWT_SECRET');
  }

  get JWT_REFRESH_SECRET(): string {
    return this.getEnvVariable('JWT_REFRESH_SECRET');
  }

  get JWT_REFREH_EXPIRE(): string {
    return this.getEnvVariable('JWT_REFRESH_EXPIRE');
  }
}
