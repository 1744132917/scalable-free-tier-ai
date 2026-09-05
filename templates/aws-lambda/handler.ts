import type { SQSEvent } from 'aws-lambda';

export async function handler(event: SQSEvent) {
  for (const record of event.Records) {
    const payload = JSON.parse(record.body);
    console.log(JSON.stringify({ level: 'info', msg: 'processing job', payload }));
  }
  return { statusCode: 200 };
}
