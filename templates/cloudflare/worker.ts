export interface Env {
  EDGE_CACHE: KVNamespace;
  API_KEY_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.headers.get('x-api-key') !== env.API_KEY_SECRET) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    }

    const cacheKey = new URL(request.url).pathname + ':' + (await request.clone().text());
    const cached = await env.EDGE_CACHE.get(cacheKey);
    if (cached) return new Response(cached, { headers: { 'content-type': 'application/json' } });

    const body = JSON.stringify({ ok: true, message: 'route to core router from worker' });
    await env.EDGE_CACHE.put(cacheKey, body, { expirationTtl: 120 });
    return new Response(body, { headers: { 'content-type': 'application/json' } });
  }
};
