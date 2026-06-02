import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Retrieve the allowed roles from the decorator metadata
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    
    const { user } = context.switchToHttp().getRequest();

    const hasRole = requiredRoles.some((role) => user?.role === role);
    
    if (!hasRole) {
      throw new ForbiddenException('Your account role does not have permission to access or modify this resource.');
    }

    return true;
  }
}