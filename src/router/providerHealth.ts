import type { ProviderHealth } from '../types.js';

export class ProviderHealthStore {
  private readonly health = new Map<string, ProviderHealth>();

  update(entry: ProviderHealth): void {
    this.health.set(entry.provider, entry);
  }

  list(): ProviderHealth[] {
    return [...this.health.values()];
  }
}
