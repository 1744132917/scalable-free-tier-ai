export type TaskType = 'chat' | 'embedding' | 'image' | 'tts';

export interface RouterRequest {
  tenantId: string;
  taskType: TaskType;
  prompt: string;
  model?: string;
  maxTokens?: number;
  idempotencyKey?: string;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

export interface RouterResponse {
  provider: string;
  content: string;
  usage: Usage;
  cacheHit?: boolean;
}

export interface ProviderHealth {
  provider: string;
  healthy: boolean;
  latencyMs: number;
  failures: number;
  updatedAt: number;
}
