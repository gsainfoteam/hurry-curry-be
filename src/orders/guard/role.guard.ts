import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export const REQUIRED_ROLE_KEY = 'requiredRole';
export const RequiredRole = (role: Role) =>
  SetMetadata(REQUIRED_ROLE_KEY, role);

@Injectable()
export class OrderRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Role>(REQUIRED_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const req = context
      .switchToHttp()
      .getRequest<{ user?: { uuid?: string; role?: Role } }>();
    const userId = req.user?.uuid;
    if (!userId) throw new ForbiddenException('Invalid request context');

    const role =
      req.user?.role ??
      (
        await this.prismaService.user.findUnique({
          where: { uuid: userId },
          select: { role: true },
        })
      )?.role;

    if (!role) throw new ForbiddenException('User not found');
    if (role !== required) throw new ForbiddenException('Insufficient role');
    return true;
  }
}
