import { createHash } from 'node:crypto';
import type { RouterRequest } from '../types.js';

export function fingerprintRequest(req: RouterRequest): string {
  const payload = `${req.tenantId}|${req.taskType}|${req.model ?? ''}|${req.prompt}|${req.maxTokens ?? ''}`;
  return createHash('sha256').update(payload).digest('hex');
}
