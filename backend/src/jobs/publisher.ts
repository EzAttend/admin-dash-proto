import { getChannel, ENTITY_TYPE_TO_QUEUE } from '@/config/queue';
import type { EntityType } from '@/models/upload-job.model';

export interface JobMessage {
  jobId: string;
  entityType: EntityType;
  totalRows: number;
  csvPayload: string;
}

export async function publishJob(message: JobMessage): Promise<boolean> {
  const queue = ENTITY_TYPE_TO_QUEUE[message.entityType];
  if (!queue) {
    throw new Error(`No queue mapping for entity type: ${message.entityType}`);
  }

  const channel = await getChannel();
  const payload = Buffer.from(JSON.stringify(message));

  const sent = channel.sendToQueue(queue, payload, {
    persistent: true,
    contentType: 'application/json',
    headers: {
      'x-retry-count': 0,
    },
  });

  if (!sent) {
    console.warn(`[Publisher] Back-pressure on queue "${queue}" — message NOT sent`);
  }

  return sent;
}
