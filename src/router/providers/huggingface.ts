import { cfg } from '../../config.js';
import type { RouterRequest, RouterResponse } from '../../types.js';
import { HttpProviderBase } from './base.js';

export class HuggingFaceAdapter extends HttpProviderBase {
  name = 'huggingface';
  enabled = Boolean(cfg.HUGGINGFACE_API_KEY);

  async complete(req: RouterRequest): Promise<RouterResponse> {
    if (!cfg.HUGGINGFACE_API_KEY) throw new Error('HF key missing');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    headers.Authorization = 'Bearer ' + cfg.HUGGINGFACE_API_KEY;
    const res = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-base', {
      method: 'POST',
      headers,
      body: JSON.stringify({ inputs: req.prompt })
    });
    if (!res.ok) throw new Error(`HF failed: ${res.status}`);
    const json = (await res.json()) as any;
    return {
      provider: this.name,
      content: json?.[0]?.generated_text ?? JSON.stringify(json),
      usage: { inputTokens: req.prompt.length / 4, outputTokens: 64, estimatedCostUsd: 0 }
    };
  }
}
