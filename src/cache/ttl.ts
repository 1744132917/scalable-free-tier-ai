import type { TaskType } from '../types.js';

const ttlSecondsByTask: Record<TaskType, number> = {
  chat: 120,
  embedding: 3600,
  image: 900,
  tts: 1800
};

export function ttlForTask(taskType: TaskType): number {
  return ttlSecondsByTask[taskType] ?? 120;
}
