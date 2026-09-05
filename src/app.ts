import express from 'express';
import { randomUUID } from 'node:crypto';
import { cfg } from './config.js';
import { registry } from './observability/metrics.js';
import { logger } from './observability/logger.js';
import { AIRouter } from './router/aiRouter.js';
import { extractTenant } from './security/tenant.js';
import { requireApiKey } from './security/auth.js';
import { IdempotencyStore } from './security/idempotency.js';
import { verifyWebhookSignature } from './security/webhook.js';
import { chat } from './services/chatService.js';
import { createEmbedding, cosineSimilarity } from './services/embeddingsService.js';
import { ImageQueue } from './services/imageQueue.js';
import { streamTokens } from './services/streaming.js';
import { processTtsBatch } from './services/ttsBatch.js';

export function createApp(router = new AIRouter()) {
  const app = express();
  const idempotency = new IdempotencyStore();
  const images = new ImageQueue();

  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info(
        { method: req.method, url: req.originalUrl, statusCode: res.statusCode, latencyMs: Date.now() - start },
        'request complete'
      );
    });
    next();
  });
  app.use(express.json({ limit: '1mb' }));
  app.use(requireApiKey);
  app.use(extractTenant);

  app.get('/health', async (_req, res) => {
    const providers = await router.healthChecks();
    res.json({ ok: true, providers });
  });

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', registry.contentType);
    res.send(await registry.metrics());
  });

  app.post('/v1/chat', async (req, res) => {
    const tenantId = (req as any).tenantId as string;
    const prompt = String(req.body?.prompt ?? '').trim();
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    const idemKey = req.header('idempotency-key');
    if (idemKey) {
      const prior = idempotency.get(idemKey);
      if (prior) return res.json(JSON.parse(prior));
    }

    const result = await router.route({ tenantId, taskType: 'chat', prompt, idempotencyKey: idemKey ?? undefined });
    if (idemKey) idempotency.set(idemKey, JSON.stringify(result));

    if (req.query.stream === 'true') {
      await streamTokens(res, result.content);
      return;
    }

    res.json(result);
  });

  app.post('/v1/images', async (req, res) => {
    const tenantId = (req as any).tenantId as string;
    const prompt = String(req.body?.prompt ?? '').trim();
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    const job = images.enqueue({ id: randomUUID(), tenantId, prompt });
    images.markProcessing(job.id);
    const result = await router.route({ tenantId, taskType: 'image', prompt });
    images.markDone(job.id);
    res.status(202).json({ job, result });
  });

  app.post('/v1/tts/batch', async (req, res) => {
    const tasks = Array.isArray(req.body?.tasks) ? req.body.tasks : [];
    const normalized = tasks.map((t: any, i: number) => ({
      id: String(t.id ?? `task-${i}`),
      text: String(t.text ?? ''),
      voice: String(t.voice ?? 'alloy')
    }));
    const output = await processTtsBatch(normalized);
    res.json({ items: output });
  });

  app.post('/v1/embeddings', (req, res) => {
    const docs = Array.isArray(req.body?.docs) ? req.body.docs : [];
    const query = String(req.body?.query ?? '');
    const queryEmbedding = createEmbedding(query);
    const scored = docs
      .map((doc: any) => {
        const text = String(doc.text ?? '');
        const embedding = createEmbedding(text);
        return { id: String(doc.id ?? ''), score: cosineSimilarity(queryEmbedding, embedding) };
      })
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
      .slice(0, 5);
    res.json({ matches: scored });
  });

  app.post('/webhooks/provider', express.text({ type: '*/*' }), (req, res) => {
    const signature = req.header('x-signature-sha256') ?? '';
    const valid = verifyWebhookSignature(String(req.body ?? ''), signature, cfg.WEBHOOK_SIGNING_SECRET);
    if (!valid) return res.status(401).json({ error: 'invalid signature' });
    res.json({ accepted: true });
  });

  app.post('/admin/invalidate/:tenantId', async (req, res) => {
    await router.invalidateTenant(req.params.tenantId);
    res.json({ ok: true });
  });

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err }, 'request failed');
    res.status(500).json({ error: err instanceof Error ? err.message : 'internal error' });
  });

  return app;
}
