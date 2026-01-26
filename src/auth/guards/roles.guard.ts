import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';
import { JwtPayload } from '../services/auth-token.service';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    // Get required roles from route metadata or endpoint
    const requiredRoles: UserRole[] = Reflect.getMetadata('roles', context.getHandler()) || [];

    if (requiredRoles.length === 0) {
      // No specific roles required
      return true;
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
