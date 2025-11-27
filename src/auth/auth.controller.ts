import {
  Body,
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './guard/jwt.guard';
import { RegisterUserDto } from './dto/req/registerUser.dto';
import { LoginDto } from './dto/req/login.dto';
import { RefreshTokenDto } from './dto/req/refreshToken.dto'; // 👈 New DTO needed

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  @ApiCreatedResponse({ description: 'Returns access and refresh tokens' })
  @ApiConflictResponse({ description: 'Email already exists' })
  async register(
    @Body() registerDto: RegisterUserDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiOkResponse({ description: 'Returns access and refresh tokens' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    return await this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh Access Token' })
  @ApiOkResponse({ description: 'Returns new access and refresh tokens' })
  @ApiUnauthorizedResponse({ description: 'Invalid Refresh Token' })
  async refreshToken(
    @Body() body: RefreshTokenDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    return await this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiOkResponse({ description: 'Logout successful' })
  async logout(@Body() body: RefreshTokenDto): Promise<{ message: string }> {
    await this.authService.logOut(body.refreshToken);
    return { message: 'Logout successful' };
  }
}