export function createEmbedding(text: string): number[] {
  const values = new Array(8).fill(0);
  for (let i = 0; i < text.length; i += 1) {
    values[i % values.length] += text.charCodeAt(i);
  }
  return values.map((v) => Number((v / Math.max(1, text.length)).toFixed(4)));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((acc, v, i) => acc + v * (b[i] ?? 0), 0);
  const am = Math.sqrt(a.reduce((acc, v) => acc + v * v, 0));
  const bm = Math.sqrt(b.reduce((acc, v) => acc + v * v, 0));
  if (am === 0 || bm === 0) return 0;
  return dot / (am * bm);
}
