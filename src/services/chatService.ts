import type { AIRouter } from '../router/aiRouter.js';
import type { RouterRequest } from '../types.js';

export async function chat(router: AIRouter, req: RouterRequest): Promise<string> {
  const response = await router.route(req);
  return response.content;
}
