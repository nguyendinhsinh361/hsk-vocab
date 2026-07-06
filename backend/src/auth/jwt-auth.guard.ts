import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { TokenService, type TokenPayload } from './token.service';

/** Request đã gắn user từ token. */
export interface AuthedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Guard GLOBAL kiểu "soft":
 *  - Có Authorization Bearer → verify chữ ký; sai/hết hạn → 401.
 *  - Không có token → cho qua như KHÁCH (service rơi về demo user).
 * Danh tính chỉ đến từ token đã ký — không còn tin header x-user-id
 * do client tự khai. Khi cần bắt buộc đăng nhập, đổi nhánh "không token"
 * thành throw + thêm decorator @Public() cho auth/health.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private tokens: TokenService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const auth = req.header('authorization');
    if (!auth) return true; // khách

    const token = auth.replace(/^Bearer\s+/i, '');
    const payload = this.tokens.verify(token);
    if (!payload) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
    req.user = payload;
    return true;
  }
}
