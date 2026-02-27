import type { ConsumeMessage } from 'amqplib';
import { getChannel, MAX_RETRIES, QUEUES, setOnReconnect } from '@/config/queue';
import { ingestCsv } from '@/ingestion';
import type { EntityConfig } from '@/ingestion';
import {
  markJobRunning,
  markJobCompleted,
  markJobFailed,
  updateJobProgress,
} from '@/services/job.service';
import type { JobMessage } from './publisher';
import type { EntityType } from '@/models/upload-job.model';


const configRegistry = new Map<EntityType, EntityConfig<Record<string, unknown>>>();

export function registerEntityConfig(
  entityType: EntityType,
  config: EntityConfig<Record<string, unknown>>,
): void {
  configRegistry.set(entityType, config);
}

async function handleMessage(msg: ConsumeMessage): Promise<void> {
  const channel = await getChannel();
  const retryCount = (msg.properties.headers?.['x-retry-count'] as number) ?? 0;

  let job: JobMessage;

  try {
    job = JSON.parse(msg.content.toString()) as JobMessage;
  } catch {
    console.error('[Worker] Failed to parse message — dead-lettering');
    channel.nack(msg, false, false);
    return;
  }

  const { jobId, entityType, csvPayload } = job;

  console.log(`[Worker] Processing job ${jobId} (${entityType}), attempt ${retryCount + 1}`);

  // Look up entity config
  const config = configRegistry.get(entityType);
  if (!config) {
    console.error(`[Worker] No config registered for entity type: ${entityType}`);
    await markJobFailed(jobId, `No entity config registered for ${entityType}`);
    channel.nack(msg, false, false);
    return;
  }

  // Mark job as RUNNING
  await markJobRunning(jobId);

  try {
    const csvBuffer = Buffer.from(csvPayload, 'base64');

    const result = await ingestCsv(csvBuffer, config, async (processedRows: number) => {
      await updateJobProgress(jobId, processedRows);
    });

    await markJobCompleted(
      jobId,
      result.successCount,
      result.failureCount,
      result.errors,
    );

    console.log(
      `[Worker] Job ${jobId} completed: ${result.successCount} ok, ${result.failureCount} failed`,
    );

    channel.ack(msg);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[Worker] Job ${jobId} crashed:`, errorMessage);

    if (retryCount < MAX_RETRIES - 1) {
      channel.nack(msg, false, false);

      const queue = QUEUES[entityType as keyof typeof QUEUES];
      if (queue) {
        channel.sendToQueue(queue, msg.content, {
          persistent: true,
          contentType: 'application/json',
          headers: {
            'x-retry-count': retryCount + 1,
          },
        });
      }
    } else {
      // Max retries exceeded
      console.error(`[Worker] Job ${jobId} exhausted all retries — marking FAILED`);
      await markJobFailed(jobId, `Max retries (${MAX_RETRIES}) exceeded: ${errorMessage}`);
      channel.nack(msg, false, false);
    }
  }
}

export async function startWorker(): Promise<void> {
  setOnReconnect(subscribeConsumers);
  await subscribeConsumers();
}

async function subscribeConsumers(): Promise<void> {
  const channel = await getChannel();

  for (const queue of Object.values(QUEUES)) {
    await channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        await handleMessage(msg);
      } catch (err) {
        console.error(`[Worker] Unhandled error in message handler:`, err);
        // Safety net — nack to avoid infinite loop
        channel.nack(msg, false, false);
      }
    });

    console.log(`[Worker] Listening on queue: ${queue}`);
  }

  console.log('[Worker] All import workers started');
}
