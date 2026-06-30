import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthUser } from '../auth-user';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';

/** Route-level RBAC. Resource-level ownership stays in services —
 *  this guard cannot know whose order it is. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required?.length) return true;
    const { user } = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    return user !== undefined && required.includes(user.role);
  }
}
