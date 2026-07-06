import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

/** Payload trong access token. */
export interface TokenPayload {
  /** userId */
  sub: string;
  email: string;
  /** Unix seconds hết hạn. */
  exp: number;
}

const DEFAULT_TTL_SEC = 30 * 24 * 60 * 60; // 30 ngày

/**
 * JWT HS256 tự cài bằng node:crypto (không thêm dependency).
 * Đủ cho access token nội bộ: chữ ký HMAC + exp, so sánh timing-safe.
 */
@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly secret: string;

  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      this.logger.warn(
        'JWT_SECRET chưa được đặt — dùng secret dev. KHÔNG chạy production thế này.',
      );
    }
    this.secret = secret ?? 'dev-only-secret-migii-hsk';
  }

  sign(payload: Omit<TokenPayload, 'exp'>, ttlSec = DEFAULT_TTL_SEC): string {
    const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const exp = Math.floor(Date.now() / 1000) + ttlSec;
    const body = b64url(JSON.stringify({ ...payload, exp }));
    return `${header}.${body}.${this.hmac(`${header}.${body}`)}`;
  }

  /** Trả payload nếu token hợp lệ và còn hạn; ngược lại null. */
  verify(token: string): TokenPayload | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expected = this.hmac(`${header}.${body}`);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    try {
      const payload = JSON.parse(
        Buffer.from(body, 'base64url').toString('utf8'),
      ) as TokenPayload;
      if (!payload.sub || typeof payload.exp !== 'number') return null;
      if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
      return payload;
    } catch {
      return null;
    }
  }

  private hmac(data: string): string {
    return createHmac('sha256', this.secret).update(data).digest('base64url');
  }
}

function b64url(s: string): string {
  return Buffer.from(s, 'utf8').toString('base64url');
}
