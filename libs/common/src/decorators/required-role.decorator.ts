import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const REQUIRED_ROLE_KEY = 'requiredRole';
export const RequiredRole = (role: Role) =>
  SetMetadata(REQUIRED_ROLE_KEY, role);
