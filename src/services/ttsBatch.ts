export interface TtsTask {
  id: string;
  text: string;
  voice: string;
}

export async function processTtsBatch(tasks: TtsTask[]): Promise<{ id: string; url: string }[]> {
  return tasks.map((t) => ({ id: t.id, url: `https://cdn.example.invalid/audio/${t.id}.mp3` }));
}
