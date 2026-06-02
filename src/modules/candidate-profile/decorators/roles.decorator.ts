import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
// This decorator allows  to pass multiple roles if an endpoint supports more than one
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);