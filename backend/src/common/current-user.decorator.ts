import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthedRequest } from '../auth/jwt-auth.guard';

/**
 * Lấy userId hiện tại từ token đã verify (JwtAuthGuard gắn req.user).
 * Không có token (khách) → chuỗi rỗng → service rơi về demo user.
 * KHÔNG còn đọc header x-user-id (client tự khai được → giả mạo).
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    return req.user?.sub ?? '';
  },
);

// Email demo user (seed) — resolveUserId fallback về user này khi là khách.
export const DEMO_USER_EMAIL = 'demo@migii.local';
