import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Cache Redis dùng chung. Thiết kế "degrade an toàn": mọi thao tác bọc try/catch,
 * nếu Redis chưa bật / lỗi → coi như cache miss (trả null / no-op), KHÔNG ném lỗi,
 * để request rơi về DB thay vì fail. Bật Redis chỉ để tăng tốc, không phải bắt buộc.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('RedisService');
  private client?: Redis;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const url =
      this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.client = new Redis(url, {
      maxRetriesPerRequest: 2,
      // Không xếp hàng offline: khi Redis chưa sẵn sàng, lệnh fail ngay → rơi về DB.
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });
    // Chỉ cảnh báo, không để 'error' làm crash tiến trình.
    this.client.on('error', (e) => this.logger.warn(`Redis: ${e.message}`));
  }

  async onModuleDestroy() {
    await this.client?.quit().catch(() => undefined);
  }

  /** Lấy giá trị JSON đã cache; miss/lỗi → null. */
  async getJson<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client?.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  /** Ghi JSON kèm TTL (giây); lỗi → bỏ qua. */
  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.client?.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      /* bỏ qua: cache là tuỳ chọn */
    }
  }

  /** Xoá key (invalidate cache). */
  async del(key: string): Promise<void> {
    try {
      await this.client?.del(key);
    } catch {
      /* bỏ qua */
    }
  }
}
