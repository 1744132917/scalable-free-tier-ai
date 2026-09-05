import type { Redis } from 'ioredis';

export class RedisCache {
  constructor(private readonly redis?: Redis) {}

  async get(key: string): Promise<string | null> {
    if (!this.redis) return null;
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!this.redis) return;
    await this.redis.set(key, value, 'EX', ttlSeconds);
  }

  async invalidate(pattern: string): Promise<void> {
    if (!this.redis) return;
    const keys = await this.redis.keys(pattern);
    if (keys.length) await this.redis.del(...keys);
  }
}
