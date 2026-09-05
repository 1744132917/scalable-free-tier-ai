import { timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { cfg } from '../config.js';

function safeEquals(a: string, b: string): boolean {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const provided = req.header('x-api-key');
  if (!provided || !safeEquals(provided, cfg.API_KEY_SECRET)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  next();
}
