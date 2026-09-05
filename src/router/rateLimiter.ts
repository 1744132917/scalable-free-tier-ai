import type { Redis } from 'ioredis';

interface Bucket {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private readonly memoryBuckets = new Map<string, Bucket>();

  constructor(private readonly redis?: Redis) {}

  async allow(key: string, limit: number, windowSeconds = 60): Promise<boolean> {
    if (this.redis) {
      const tx = this.redis.multi();
      tx.incr(key);
      tx.expire(key, windowSeconds);
      const result = await tx.exec();
      const count = Number(result?.[0]?.[1] ?? 0);
      return count <= limit;
    }

    const now = Date.now();
    const bucket = this.memoryBuckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.memoryBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return true;
    }

    bucket.count += 1;
    return bucket.count <= limit;
  }
}
