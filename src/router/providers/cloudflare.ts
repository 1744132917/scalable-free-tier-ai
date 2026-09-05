import { cfg } from '../../config.js';
import type { RouterRequest, RouterResponse } from '../../types.js';
import { HttpProviderBase } from './base.js';

export class CloudflareWorkersAIAdapter extends HttpProviderBase {
  name = 'cloudflare-workers-ai';
  enabled = Boolean(cfg.CLOUDFLARE_ACCOUNT_ID && cfg.CLOUDFLARE_API_TOKEN);

  async complete(req: RouterRequest): Promise<RouterResponse> {
    if (!cfg.CLOUDFLARE_ACCOUNT_ID || !cfg.CLOUDFLARE_API_TOKEN) {
      throw new Error('Cloudflare credentials missing');
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${cfg.CLOUDFLARE_ACCOUNT_ID}/ai/run/${cfg.CLOUDFLARE_AI_MODEL}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    headers.Authorization = 'Bearer ' + cfg.CLOUDFLARE_API_TOKEN;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt: req.prompt })
    });

    if (!res.ok) throw new Error(`Cloudflare AI failed: ${res.status}`);
    const json = (await res.json()) as any;
    return {
      provider: this.name,
      content: json?.result?.response ?? JSON.stringify(json?.result ?? ''),
      usage: { inputTokens: req.prompt.length / 4, outputTokens: 64, estimatedCostUsd: 0 }
    };
  }
}
