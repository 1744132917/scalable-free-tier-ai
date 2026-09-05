import { cfg } from '../../config.js';
import type { RouterRequest, RouterResponse } from '../../types.js';
import { HttpProviderBase } from './base.js';

export class TogetherAdapter extends HttpProviderBase {
  name = 'together';
  enabled = Boolean(cfg.TOGETHER_API_KEY);

  async complete(req: RouterRequest): Promise<RouterResponse> {
    if (!cfg.TOGETHER_API_KEY) throw new Error('Together key missing');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    headers.Authorization = 'Bearer ' + cfg.TOGETHER_API_KEY;
    const res = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: req.model ?? 'meta-llama/Llama-3.1-8B-Instruct-Turbo',
        messages: [{ role: 'user', content: req.prompt }],
        max_tokens: req.maxTokens ?? 256
      })
    });
    if (!res.ok) throw new Error(`Together failed: ${res.status}`);
    const json = (await res.json()) as any;
    return {
      provider: this.name,
      content: json.choices?.[0]?.message?.content ?? '',
      usage: {
        inputTokens: json.usage?.prompt_tokens ?? 0,
        outputTokens: json.usage?.completion_tokens ?? 0,
        estimatedCostUsd: ((json.usage?.total_tokens ?? 0) / 1000) * 0.0002
      }
    };
  }
}
