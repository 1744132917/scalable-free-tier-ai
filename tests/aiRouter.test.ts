import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AIRouter } from '../src/router/aiRouter.js';
import type { ProviderAdapter } from '../src/router/providers/base.js';
import type { RouterRequest, RouterResponse } from '../src/types.js';

class MockProvider implements ProviderAdapter {
  enabled = true;

  constructor(
    public name: string,
    private readonly impl: (req: RouterRequest) => Promise<RouterResponse>,
    private readonly taskSupport: RouterRequest['taskType'][] = ['chat', 'embedding', 'image', 'tts']
  ) {}

  supports(taskType: RouterRequest['taskType']) {
    return this.taskSupport.includes(taskType);
  }

  complete(req: RouterRequest) {
    return this.impl(req);
  }

  async healthcheck() {
    return { healthy: true, latencyMs: 1 };
  }
}

describe('AIRouter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fails over when primary provider fails', async () => {
    const failing = new MockProvider('failing', async () => {
      throw new Error('boom');
    });

    const healthy = new MockProvider('healthy', async () => ({
      provider: 'healthy',
      content: 'ok',
      usage: { inputTokens: 1, outputTokens: 1, estimatedCostUsd: 0.01 }
    }));

    const router = new AIRouter([failing, healthy]);
    const result = await router.route({ tenantId: 't1', taskType: 'chat', prompt: 'hello' });
    expect(result.provider).toBe('healthy');
    expect(result.content).toBe('ok');
  });

  it('returns edge-cache result for duplicate request fingerprint', async () => {
    const complete = vi.fn(async () => ({
      provider: 'only',
      content: 'first',
      usage: { inputTokens: 1, outputTokens: 1, estimatedCostUsd: 0.001 }
    }));

    const router = new AIRouter([new MockProvider('only', complete)]);
    const request = {
      tenantId: `t2-${Date.now()}`,
      taskType: 'chat',
      prompt: `repeat-${Date.now()}`
    } as const;

    const first = await router.route(request);
    const second = await router.route(request);

    expect(first.cacheHit).toBeUndefined();
    expect(second.cacheHit).toBe(true);
    expect(complete).toHaveBeenCalledTimes(1);
  });
});
