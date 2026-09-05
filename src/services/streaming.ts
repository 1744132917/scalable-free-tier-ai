import type { Response } from 'express';

export async function streamTokens(res: Response, text: string): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const tokens = text.split(' ');
  for (const token of tokens) {
    res.write(`data: ${JSON.stringify({ token })}\n\n`);
  }
  res.write('data: [DONE]\n\n');
  res.end();
}
