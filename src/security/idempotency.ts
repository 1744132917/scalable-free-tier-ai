export class IdempotencyStore {
  private readonly keys = new Map<string, string>();

  get(key: string): string | undefined {
    return this.keys.get(key);
  }

  set(key: string, value: string): void {
    this.keys.set(key, value);
  }
}
