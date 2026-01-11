import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from './auth.repository';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/req/registerUser.dto';
import { JwtTokenType } from './types/jwtToken.type';
import { LoginDto } from './dto/req/login.dto';
import { PayloadDto } from './dto/req/payload.dto';
import { User } from '@prisma/client';

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
    let user: User;
    try {
      user = await this.authRepository.findUserByEmail(body.email);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('Invalid credentials');
      }

      throw error;
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
    const refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    let payload: PayloadDto & { iat: number; exp: number };
    try {
      payload = this.jwtService.verify<
        PayloadDto & { iat: number; exp: number }
      >(refreshToken, {
        secret: refreshSecret,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    let user: User;
    try {
      user = await this.authRepository.findUserByUuid(payload.uuid);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      throw error;
    }

    if (!user.refreshToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const isTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokens = await this.generateTokens(user.uuid, user.email);

    const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
    await this.authRepository.updateToken(user.uuid, hashedRefreshToken);

    return tokens;
  }

  async findUserByUuid(uuid: string): Promise<User> {
    return await this.authRepository.findUserByUuid(uuid);
  }

  async logOut(args: {
    uuid: string;
    refreshToken?: string | null;
  }): Promise<void> {
    const { uuid, refreshToken } = args;

    if (refreshToken) {
      const refreshSecret =
        this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

      let payload: PayloadDto & { iat: number; exp: number };
      try {
        payload = this.jwtService.verify<
          PayloadDto & { iat: number; exp: number }
        >(refreshToken, {
          secret: refreshSecret,
        });
      } catch (error) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (payload.uuid !== uuid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      let user: User;
      try {
        user = await this.authRepository.findUserByUuid(uuid);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new UnauthorizedException('Invalid refresh token');
        }

        throw error;
      }

      if (!user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!isTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }
    }

    await this.authRepository.updateToken(uuid, null);
  }

  private async generateTokens(
    uuid: string,
    email: string,
  ): Promise<JwtTokenType> {
    const payload: PayloadDto = { email, uuid };

    const accessSecret = this.configService.getOrThrow<string>('JWT_SECRET');
    const refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token,
      refresh_token,
    };
  }
}
