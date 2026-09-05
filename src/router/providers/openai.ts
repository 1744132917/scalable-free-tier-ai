import { cfg } from '../../config.js';
import type { RouterRequest, RouterResponse } from '../../types.js';
import { HttpProviderBase } from './base.js';

export class OpenAIAdapter extends HttpProviderBase {
  name = 'openai';
  enabled = Boolean(cfg.OPENAI_API_KEY);

  async complete(req: RouterRequest): Promise<RouterResponse> {
    if (!cfg.OPENAI_API_KEY) throw new Error('OpenAI key missing');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    headers.Authorization = 'Bearer ' + cfg.OPENAI_API_KEY;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: req.model ?? 'gpt-4o-mini',
        messages: [{ role: 'user', content: req.prompt }],
        max_tokens: req.maxTokens ?? 256
      })
    });
    if (!res.ok) throw new Error(`OpenAI failed: ${res.status}`);
    const json = (await res.json()) as any;
    return {
      provider: this.name,
      content: json.choices?.[0]?.message?.content ?? '',
      usage: {
        inputTokens: json.usage?.prompt_tokens ?? 0,
        outputTokens: json.usage?.completion_tokens ?? 0,
        estimatedCostUsd: ((json.usage?.total_tokens ?? 0) / 1000) * 0.0005
      }
    };
  }
}
