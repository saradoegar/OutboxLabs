import { Queue, QueueEvents } from 'bullmq';
import { redisConnectionOptions } from '../config/redis.js';
import { EmailJobData } from '../models/email.model.js';

export const EMAIL_QUEUE_NAME = 'email-queue';

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 1000, // Keep last 1000 completed jobs for audit / inspection
    },
    removeOnFail: {
      count: 5000, // Keep failed jobs for inspection
    },
  },
});

export const emailQueueEvents = new QueueEvents(EMAIL_QUEUE_NAME, {
  connection: redisConnectionOptions,
});

emailQueueEvents.on('error', (err) => {
  console.warn('[BullMQ QueueEvents] Warning:', err.message);
});

/**
 * Schedule an email job with BullMQ delayed job semantics (NO CRON).
 * Redis natively persists delayed jobs in sorted sets, preserving them across server restarts.
 */
export const scheduleEmailJob = async (
  jobData: EmailJobData,
  scheduledTime?: Date | null
): Promise<string> => {
  let delayMs = 0;

  if (scheduledTime) {
    const targetMs = scheduledTime.getTime();
    const nowMs = Date.now();
    delayMs = Math.max(0, targetMs - nowMs);
  }

  // Use idempotencyKey as the jobId to guarantee idempotency and prevent duplicate job queuing
  const job = await emailQueue.add('send-email', jobData, {
    jobId: jobData.idempotencyKey,
    delay: delayMs,
  });

  return job.id || jobData.idempotencyKey;
};
