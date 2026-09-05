import { cfg } from '../../config.js';
import type { RouterRequest, RouterResponse } from '../../types.js';
import { HttpProviderBase } from './base.js';

export class ReplicateAdapter extends HttpProviderBase {
  name = 'replicate';
  enabled = Boolean(cfg.REPLICATE_API_KEY);

  supports(taskType: RouterRequest['taskType']): boolean {
    return taskType === 'chat' || taskType === 'image';
  }

  async complete(req: RouterRequest): Promise<RouterResponse> {
    if (!cfg.REPLICATE_API_KEY) throw new Error('Replicate key missing');
    const res = await fetch('https://api.replicate.com/v1/models/meta/meta-llama-3-8b-instruct/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${cfg.REPLICATE_API_KEY}`
      },
      body: JSON.stringify({ input: { prompt: req.prompt } })
    });
    if (!res.ok) throw new Error(`Replicate failed: ${res.status}`);
    const json = (await res.json()) as any;
    return {
      provider: this.name,
      content: json?.output?.join?.('') ?? JSON.stringify(json?.output ?? ''),
      usage: { inputTokens: req.prompt.length / 4, outputTokens: 80, estimatedCostUsd: 0.001 }
    };
  }
}
