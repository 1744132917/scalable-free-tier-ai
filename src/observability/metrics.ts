import { Counter, Gauge, Histogram, Registry } from 'prom-client';

export const registry = new Registry();

export const requestLatency = new Histogram({
  name: 'ai_router_request_latency_ms',
  help: 'Latency for provider requests',
  labelNames: ['provider', 'task_type'],
  buckets: [50, 100, 250, 500, 1000, 5000],
  registers: [registry]
});

export const requestFailures = new Counter({
  name: 'ai_router_provider_failures_total',
  help: 'Failed provider requests',
  labelNames: ['provider'],
  registers: [registry]
});

export const requestSuccess = new Counter({
  name: 'ai_router_provider_success_total',
  help: 'Successful provider requests',
  labelNames: ['provider'],
  registers: [registry]
});

export const costGauge = new Gauge({
  name: 'ai_router_tenant_cost_usd',
  help: 'Accumulated tenant costs',
  labelNames: ['tenant_id'],
  registers: [registry]
});
