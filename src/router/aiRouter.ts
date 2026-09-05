import { Redis } from 'ioredis';
import { cfg } from '../config.js';
import { fingerprintRequest } from '../cache/fingerprint.js';
import { RedisCache } from '../cache/redisCache.js';
import { RequestLock } from '../cache/requestLock.js';
import { SqliteEdgeCache } from '../cache/sqliteCache.js';
import { ttlForTask } from '../cache/ttl.js';
import { logger } from '../observability/logger.js';
import { requestFailures, requestLatency, requestSuccess } from '../observability/metrics.js';
import { CircuitBreaker } from './circuitBreaker.js';
import { CostTracker } from './costTracker.js';
import { ProviderHealthStore } from './providerHealth.js';
import { CloudflareWorkersAIAdapter } from './providers/cloudflare.js';
import type { ProviderAdapter } from './providers/base.js';
import { HuggingFaceAdapter } from './providers/huggingface.js';
import { OpenAIAdapter } from './providers/openai.js';
import { ReplicateAdapter } from './providers/replicate.js';
import { TogetherAdapter } from './providers/together.js';
import { RateLimiter } from './rateLimiter.js';
import type { RouterRequest, RouterResponse } from '../types.js';

export class AIRouter {
  private readonly breaker = new CircuitBreaker();
  private readonly costTracker = new CostTracker();
  private readonly health = new ProviderHealthStore();
  private readonly lock = new RequestLock();
  private readonly sqliteCache = new SqliteEdgeCache(cfg.SQLITE_PATH);
  private readonly redis = cfg.REDIS_URL ? new Redis(cfg.REDIS_URL) : undefined;
  private readonly redisCache = new RedisCache(this.redis);
  private readonly limiter = new RateLimiter(this.redis);

  constructor(
    private readonly providers: ProviderAdapter[] = [
      new CloudflareWorkersAIAdapter(),
      new HuggingFaceAdapter(),
      new TogetherAdapter(),
      new OpenAIAdapter(),
      new ReplicateAdapter()
    ]
  ) {}

  async route(req: RouterRequest): Promise<RouterResponse> {
    const tenantAllowed = await this.limiter.allow(
      `tenant:${req.tenantId}`,
      cfg.TENANT_RATE_LIMIT_PER_MIN
    );
    if (!tenantAllowed) throw new Error('tenant rate limit exceeded');

    if (this.costTracker.getCost(req.tenantId) > cfg.MONTHLY_BUDGET_USD) {
      throw new Error('tenant budget exceeded');
    }

    const fp = `${req.tenantId}:${fingerprintRequest(req)}`;
    if (cfg.FEATURE_USE_EDGE_CACHE === 'true') {
      const cachedRedis = await this.redisCache.get(fp);
      if (cachedRedis) {
        return { ...JSON.parse(cachedRedis), cacheHit: true } as RouterResponse;
      }

      const cachedEdge = this.sqliteCache.get(fp);
      if (cachedEdge) {
        return { ...JSON.parse(cachedEdge), cacheHit: true } as RouterResponse;
      }
    }

    if (!this.lock.acquire(fp)) throw new Error('duplicate request in-flight');

    try {
      let eligible = this.providers.filter((p) => p.enabled && p.supports(req.taskType));
      if (cfg.FEATURE_ENABLE_FAILOVER !== 'true') eligible = eligible.slice(0, 1);

      let lastError: Error | null = null;
      for (const provider of eligible) {
        if (this.breaker.isOpen(provider.name)) continue;

        const providerAllowed = await this.limiter.allow(
          `provider:${provider.name}`,
          cfg.PROVIDER_RATE_LIMIT_PER_MIN
        );
        if (!providerAllowed) continue;

        const start = Date.now();
        try {
          const response = await provider.complete(req);
          const duration = Date.now() - start;
          requestLatency.labels(provider.name, req.taskType).observe(duration);
          requestSuccess.labels(provider.name).inc();
          this.breaker.onSuccess(provider.name);
          this.health.update({
            provider: provider.name,
            healthy: true,
            latencyMs: duration,
            failures: 0,
            updatedAt: Date.now()
          });
          this.costTracker.addCost(req.tenantId, response.usage.estimatedCostUsd);

          const payload = JSON.stringify(response);
          const ttl = ttlForTask(req.taskType);
          if (cfg.FEATURE_USE_EDGE_CACHE === 'true') {
            await this.redisCache.set(fp, payload, ttl);
            this.sqliteCache.set(fp, payload, ttl);
          }

          return response;
        } catch (error) {
          const duration = Date.now() - start;
          requestLatency.labels(provider.name, req.taskType).observe(duration);
          requestFailures.labels(provider.name).inc();
          this.breaker.onFailure(provider.name);
          this.health.update({
            provider: provider.name,
            healthy: false,
            latencyMs: duration,
            failures: 1,
            updatedAt: Date.now()
          });
          lastError = error as Error;
          logger.warn({ err: error, provider: provider.name }, 'provider failed; trying fallback');
        }
      }

      throw lastError ?? new Error('no provider available');
    } finally {
      this.lock.release(fp);
    }
  }

  getHealth() {
    return this.health.list();
  }

  async healthChecks() {
    const checks = await Promise.all(
      this.providers.filter((p) => p.enabled).map(async (provider) => {
        const status = await provider.healthcheck();
        this.health.update({
          provider: provider.name,
          healthy: status.healthy,
          latencyMs: status.latencyMs,
          failures: status.healthy ? 0 : 1,
          updatedAt: Date.now()
        });
        return { provider: provider.name, ...status };
      })
    );
    return checks;
  }

  invalidateTenant(tenantId: string): Promise<void> {
    this.sqliteCache.invalidateTenant(tenantId);
    return this.redisCache.invalidate(`${tenantId}:*`);
  }
}
