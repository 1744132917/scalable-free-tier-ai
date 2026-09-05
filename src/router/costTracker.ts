import { costGauge } from '../observability/metrics.js';

export class CostTracker {
  private readonly costs = new Map<string, number>();

  addCost(tenantId: string, amount: number): number {
    const updated = (this.costs.get(tenantId) ?? 0) + amount;
    this.costs.set(tenantId, updated);
    costGauge.set({ tenant_id: tenantId }, updated);
    return updated;
  }

  getCost(tenantId: string): number {
    return this.costs.get(tenantId) ?? 0;
  }
}
