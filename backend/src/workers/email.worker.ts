import { Worker, Job } from 'bullmq';
import { EMAIL_QUEUE_NAME, emailQueue } from '../queues/email.queue.js';
import { redisConnectionOptions } from '../config/redis.js';
import { config } from '../config/env.js';
import { EmailJobData } from '../models/email.model.js';
import { smtpService } from '../services/smtp.service.js';
import { rateLimitService } from '../services/rate-limit.service.js';
import { slackService } from '../services/slack.service.js';
import { elasticsearchService } from '../services/elasticsearch.service.js';
import { query } from '../db/index.js';

export const processEmailJob = async (job: Job<EmailJobData>) => {
  const { emailId, sender, recipient, subject, body, delayBetweenEmailsSec, hourlyLimit } = job.data;

  console.log(`[Worker] Processing Job #${job.id} for Email: ${emailId} -> ${recipient}`);

  // 1. Idempotency & Duplicate Check: Ensure we never send the same email twice
  try {
    const checkRes = await query('SELECT status FROM emails WHERE id = $1', [emailId]);
    if (checkRes.rows.length > 0 && checkRes.rows[0].status === 'sent') {
      console.log(`[Worker] Email ${emailId} was already sent. Skipping duplicate send.`);
      return { status: 'already_sent', emailId };
    }
  } catch (err: any) {
    console.warn(`[Worker] Database check warning for ${emailId}:`, err.message);
  }

  // 2. Hourly Rate Limit Check (Redis-backed atomic counter)
  const rateLimit = await rateLimitService.checkAndIncrement(hourlyLimit);

  if (!rateLimit.allowed) {
    console.warn(
      `[Worker] Hourly rate limit of ${rateLimit.limit} reached! Rescheduling job for ${rateLimit.nextSlotTime?.toISOString()}`
    );

    // Update DB status to 'rescheduled'
    try {
      await query(
        `UPDATE emails SET status = 'rescheduled', scheduled_at = $1, updated_at = NOW() WHERE id = $2`,
        [rateLimit.nextSlotTime, emailId]
      );
    } catch (e: any) {
      console.warn('[Worker] Failed to update DB on rate-limit reschedule:', e.message);
    }

    // Reschedule in BullMQ for the next available hour
    const newJobId = `${job.data.idempotencyKey}_resched_${Date.now()}`;
    await emailQueue.add('send-email', job.data, {
      jobId: newJobId,
      delay: rateLimit.rescheduleDelayMs || 3600000,
    });

    // 3. Trigger Slack Notification on Rate Limit Event
    if (rateLimit.nextSlotTime) {
      await slackService.sendRateLimitAlert({
        limit: rateLimit.limit,
        emailId,
        recipient,
        subject,
        rescheduledTo: rateLimit.nextSlotTime,
      });
    }

    return {
      status: 'rescheduled',
      rescheduledTo: rateLimit.nextSlotTime,
      delayMs: rateLimit.rescheduleDelayMs,
    };
  }

  // 4. Minimum Delay between individual sends
  await rateLimitService.enforceDelayBetweenSends(delayBetweenEmailsSec);

  // 5. Send Email via Ethereal SMTP
  try {
    const sendResult = await smtpService.send({
      from: sender,
      to: recipient,
      subject,
      text: body,
    });

    // 6. Persist Success to Database
    try {
      await query(
        `UPDATE emails 
         SET status = 'sent', 
             sent_at = NOW(), 
             ethereal_preview_url = $1, 
             updated_at = NOW() 
         WHERE id = $2`,
        [sendResult.etherealPreviewUrl || null, emailId]
      );
    } catch (dbErr: any) {
      console.warn(`[Worker] Could not update email status in DB for ${emailId}:`, dbErr.message);
    }

    // Update index in Elasticsearch
    elasticsearchService.indexEmail({
      id: emailId,
      sender,
      recipient,
      subject,
      body,
      status: 'sent',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }).catch((e) => console.warn('[Elasticsearch] Worker update warning:', e.message));

    return {
      status: 'sent',
      emailId,
      messageId: sendResult.messageId,
      etherealPreviewUrl: sendResult.etherealPreviewUrl,
    };
  } catch (sendErr: any) {
    console.error(`[Worker] Failed to send email ${emailId}:`, sendErr.message);

    try {
      await query(
        `UPDATE emails 
         SET status = 'failed', 
             failure_reason = $1, 
             retry_count = retry_count + 1, 
             updated_at = NOW() 
         WHERE id = $2`,
        [sendErr.message, emailId]
      );
    } catch (dbErr: any) {
      console.warn('[Worker] Failed to update email failure in DB:', dbErr.message);
    }

    throw sendErr; // Let BullMQ handle automatic retry according to queue backoff settings
  }
};

export const createEmailWorker = () => {
  const concurrency = config.email.workerConcurrency;
  console.log(`[Worker] Starting Email Worker with concurrency = ${concurrency}`);

  const worker = new Worker<EmailJobData>(EMAIL_QUEUE_NAME, processEmailJob, {
    connection: redisConnectionOptions,
    concurrency,
  });

  worker.on('completed', (job: Job) => {
    console.log(`[Worker] Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err: Error) => {
    console.warn('[Worker] Worker connection warning:', err.message);
  });

  return worker;
};

// Auto-run if executed directly as a standalone process
if (process.argv[1]?.endsWith('email.worker.ts') || process.argv[1]?.endsWith('email.worker.js')) {
  createEmailWorker();
  console.log('[Worker Service] Email Worker daemon running in background.');
}
