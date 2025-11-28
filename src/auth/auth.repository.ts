import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterUserDto } from './dto/req/registerUser.dto';

@Injectable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);
  constructor(private readonly prismaService: PrismaService) {}

  async findUserByUuid(uuid: string): Promise<User> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return await this.prismaService.user.findUniqueOrThrow({
        where: { uuid },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException();
        }

        this.logger.error(error.message);
        throw new InternalServerErrorException();
      }

      this.logger.error(error.message);
      throw new InternalServerErrorException();
    }
  }

  async createUser(body: RegisterUserDto): Promise<User> {
    try {
      return await this.prismaService.user.create({
        data: {
          name: body.name,
          email: body.email,
          password: body.password,
          studentId: body.studentId,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `User with email ${body.email} already exists`,
          );
        }

        this.logger.debug(error);
        throw new InternalServerErrorException();
      }
      this.logger.error(error.message);
      throw new InternalServerErrorException();
    }
  }

  async updateToken(uuid: string, refreshToken: string | null): Promise<void> {
    try {
      await this.prismaService.user.update({
        where: { uuid },
        data: {
          refreshToken,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('User is not found');
        }

        if (error.code === 'P2002') {
          throw new ConflictException('User with your email already exists');
        }
      }

      this.logger.error(`Unexpected error for user ${uuid}`, error);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async findUserByEmail(email: string): Promise<User> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return await this.prismaService.user.findUniqueOrThrow({
        where: { email },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException();
        }

        this.logger.error(error.message);
        throw new InternalServerErrorException();
      }

      this.logger.error(error.message);
      throw new InternalServerErrorException();
    }
  }
}
