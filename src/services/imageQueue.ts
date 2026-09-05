interface ImageJob {
  id: string;
  prompt: string;
  tenantId: string;
  status: 'queued' | 'processing' | 'done';
}

export class ImageQueue {
  private readonly jobs = new Map<string, ImageJob>();

  enqueue(job: Omit<ImageJob, 'status'>): ImageJob {
    const record: ImageJob = { ...job, status: 'queued' };
    this.jobs.set(record.id, record);
    return record;
  }

  markProcessing(id: string): void {
    const job = this.jobs.get(id);
    if (job) job.status = 'processing';
  }

  markDone(id: string): void {
    const job = this.jobs.get(id);
    if (job) job.status = 'done';
  }

  get(id: string): ImageJob | undefined {
    return this.jobs.get(id);
  }
}
