import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthRepository } from '../auth.repository';
import { PayloadDto } from '../dto/req/payload.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authRepository: AuthRepository,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: PayloadDto) {
    try {
      const user = await this.authRepository.findUserByUuid(payload.uuid);
      const { password, refreshToken, ...safeUser } = user;
      return safeUser;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
