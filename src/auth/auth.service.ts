import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from './auth.repository';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/req/registerUser.dto';
import { JwtTokenType } from './types/jwtToken.type';
import { LoginDto } from './dto/req/login.dto';
import { PayloadDto } from './dto/req/payload.dto';
import { User } from 'generated/prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(body: RegisterUserDto): Promise<JwtTokenType> {
    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user = await this.authRepository.createUser({
      ...body,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(user.uuid, user.email);

    const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
    await this.authRepository.updateToken(user.uuid, hashedRefreshToken);

    return tokens;
  }

  async login(body: LoginDto): Promise<JwtTokenType> {
    const user = await this.authRepository.findUserByEmail(body.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.uuid, user.email);

    const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
    await this.authRepository.updateToken(user.uuid, hashedRefreshToken);

    return tokens;
  }

  async refresh(refreshToken: string): Promise<JwtTokenType> {
    try {
      const payload = this.jwtService.verify<
        PayloadDto & { iat: number; exp: number }
      >(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.authRepository.findUserByUuid(payload.uuid);

      if (!user.refreshToken) {
        throw new UnauthorizedException('Unauthorized action');
      }

      const isTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );
      if (!isTokenValid) {
        throw new UnauthorizedException('Unauthorized action');
      }

      const tokens = await this.generateTokens(user.uuid, user.email);

      const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
      await this.authRepository.updateToken(user.uuid, hashedRefreshToken);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async findUserByUuid(uuid: string): Promise<User> {
    return await this.authRepository.findUserByUuid(uuid);
  }

  async logOut(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify<
        PayloadDto & { iat: number; exp: number }
      >(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      await this.authRepository.updateToken(payload.uuid, null);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(
    uuid: string,
    email: string,
  ): Promise<JwtTokenType> {
    const payload: PayloadDto = { email, uuid };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token,
      refresh_token,
    };
  }
}
