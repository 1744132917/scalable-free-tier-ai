export class RequestLock {
  private readonly locks = new Map<string, number>();

  acquire(key: string, ttlMs = 10000): boolean {
    const now = Date.now();
    const expiresAt = this.locks.get(key);
    if (expiresAt && expiresAt > now) return false;
    this.locks.set(key, now + ttlMs);
    return true;
  }

  release(key: string): void {
    this.locks.delete(key);
  }
}
