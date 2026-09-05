import type { RouterRequest, RouterResponse } from '../../types.js';

export interface ProviderAdapter {
  name: string;
  enabled: boolean;
  supports(taskType: RouterRequest['taskType']): boolean;
  complete(req: RouterRequest): Promise<RouterResponse>;
  healthcheck(): Promise<{ healthy: boolean; latencyMs: number }>;
}

export abstract class HttpProviderBase implements ProviderAdapter {
  abstract name: string;
  abstract enabled: boolean;

  supports(taskType: RouterRequest['taskType']): boolean {
    return taskType === 'chat' || taskType === 'embedding';
  }

  abstract complete(req: RouterRequest): Promise<RouterResponse>;

  async healthcheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.complete({ tenantId: 'healthcheck', taskType: 'chat', prompt: 'ping', maxTokens: 4 });
      return { healthy: true, latencyMs: Date.now() - start };
    } catch {
      return { healthy: false, latencyMs: Date.now() - start };
    }
  }
}
