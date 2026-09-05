import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyWebhookSignature } from '../src/security/webhook.js';

describe('verifyWebhookSignature', () => {
  it('validates HMAC SHA-256 signatures', () => {
    const secret = 'abc1234567890123456';
    const body = JSON.stringify({ hello: 'world' });
    const sig = createHmac('sha256', secret).update(body).digest('hex');
    expect(verifyWebhookSignature(body, sig, secret)).toBe(true);
    expect(verifyWebhookSignature(body, 'invalid', secret)).toBe(false);
  });
});
