import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { isFakeData } from '../fake/fake.util';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client?: Redis;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    // Fake mode: không cần Redis (quiz dùng store in-memory).
    if (isFakeData()) return;
    const redisUrl =
      this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.client = new Redis(redisUrl);
    // Tránh crash khi chưa bật Redis — chỉ log lỗi kết nối.
    this.client.on('error', (e) => console.error('[redis]', e.message));
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  private get conn(): Redis {
    if (!this.client) throw new Error('Redis chưa khởi tạo (đang ở fake mode?)');
    return this.client;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.conn.set(key, value, 'EX', ttlSeconds);
  }

  async get(key: string): Promise<string | null> {
    return this.conn.get(key);
  }

  async del(key: string): Promise<void> {
    await this.conn.del(key);
  }
}
