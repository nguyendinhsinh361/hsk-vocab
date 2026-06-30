import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Lấy userId hiện tại. MVP CHƯA có auth: tạm đọc từ header `x-user-id`,
 * fallback về demo user (seed). Khi thêm auth (JWT/Google) → thay bằng
 * req.user.id từ JwtGuard và bỏ fallback này.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const headerId = req.header('x-user-id');
    return headerId && headerId.trim() ? headerId.trim() : DEMO_USER_ID;
  },
);

// Trùng id seed của demo@migii.local sẽ được resolve ở service nếu cần.
export const DEMO_USER_EMAIL = 'demo@migii.local';
// Placeholder; service nên resolve userId thật. Để rỗng nghĩa "dùng demo theo email".
export const DEMO_USER_ID = '';
