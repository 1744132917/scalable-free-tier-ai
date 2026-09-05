import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
const mockRouter = {
    route: async () => ({
        provider: 'mock',
        content: 'hello world',
        usage: { inputTokens: 1, outputTokens: 2, estimatedCostUsd: 0 }
    }),
    getHealth: () => [],
    healthChecks: async () => [],
    invalidateTenant: async () => { }
};
describe('chat endpoint', () => {
    it('streams SSE tokens when stream=true', async () => {
        const app = createApp(mockRouter);
        const res = await request(app)
            .post('/v1/chat?stream=true')
            .set('x-api-key', 'change-me-in-production-1234')
            .set('x-tenant-id', 'tenant')
            .send({ prompt: 'hi' });
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('text/event-stream');
        expect(res.text).toContain('data: [DONE]');
    });
});
