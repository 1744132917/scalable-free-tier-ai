interface CircuitState {
  failures: number;
  openedAt?: number;
}

export class CircuitBreaker {
  private readonly states = new Map<string, CircuitState>();

  constructor(
    private readonly failureThreshold = 3,
    private readonly resetMs = 30_000
  ) {}

  isOpen(key: string): boolean {
    const state = this.states.get(key);
    if (!state?.openedAt) return false;
    if (Date.now() - state.openedAt > this.resetMs) {
      this.states.set(key, { failures: 0 });
      return false;
    }
    return true;
  }

  onSuccess(key: string): void {
    this.states.set(key, { failures: 0 });
  }

  onFailure(key: string): void {
    const state = this.states.get(key) ?? { failures: 0 };
    const failures = state.failures + 1;
    this.states.set(key, {
      failures,
      openedAt: failures >= this.failureThreshold ? Date.now() : undefined
    });
  }
}
