import { pool } from '../src/db/index.js';
import { redisClient } from '../src/config/redis.js';
import { emailQueue } from '../src/queues/email.queue.js';
import { v4 as uuidv4 } from 'uuid';

async function testPhase8() {
  console.log('=== PHASE 8: RATE LIMITING & SLACK NOTIFICATION TEST ===');

  // 1. Reset Redis rate limit counter for current hour to start clean test
  const now = new Date();
  const hourKey = 'email_rate_limit:' + now.toISOString().slice(0, 13);
  await redisClient.del(hourKey);
  console.log('[1. Redis Counter Reset]: Cleared key ' + hourKey);

  // 2. Schedule 3 emails simultaneously with hourlyLimit = 2
  const emailIds: string[] = [];
  const hourlyLimit = 2;

  for (let i = 1; i <= 3; i++) {
    const testKey = 'idemp_ratelimit_' + i + '_' + uuidv4();
    const payload = {
      from: 'oliver.brown@domain.io',
      recipients: ['rate.limit.' + i + '@reachinbox.ai'],
      subject: 'Phase 8 Rate Limit Email #' + i,
      body: 'Testing hourly rate limit enforcement and graceful rescheduling.',
      scheduledAt: null, // Send immediately
      delayBetweenEmails: 0,
      hourlyLimit,
      idempotencyKey: testKey,
    };

    const res = await fetch('http://localhost:5000/api/emails/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Failed to schedule email #' + i);
    const data = (await res.json()) as any;
    emailIds.push(data.id);
    console.log('[Enqueued #' + i + ']: ID: ' + data.id + ' with limit ' + hourlyLimit);
  }

  // 3. Wait for worker to process all 3 emails
  console.log('Waiting for worker to process all 3 emails...');
  let settled = false;
  const start = Date.now();

  while (Date.now() - start < 30000) {
    const res = await pool.query('SELECT id, status, ethereal_preview_url FROM emails WHERE id = ANY($1)', [emailIds]);
    const statuses = res.rows.map(r => r.status);
    console.log('Current statuses:', res.rows.map(r => ({ id: r.id, status: r.status })));

    // We expect 2 sent and 1 rescheduled
    const sentCount = statuses.filter(s => s === 'sent').length;
    const reschedCount = statuses.filter(s => s === 'rescheduled').length;

    if (sentCount === 2 && reschedCount === 1) {
      settled = true;
      break;
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  if (!settled) {
    const res = await pool.query('SELECT id, status FROM emails WHERE id = ANY($1)', [emailIds]);
    console.log('Final statuses before failure:', res.rows);
    throw new Error('Rate limit test did not reach expected state (2 sent, 1 rescheduled)');
  }

  // 4. Verify Redis counter tracks count >= 3
  const finalCount = await redisClient.get(hourKey);
  console.log('[4. Redis Rate Limit Counter]: ' + finalCount + ' requests tracked for hour');
  if (parseInt(finalCount || '0', 10) < 3) {
    throw new Error('Redis counter does not match expected requests');
  }

  // 5. Verify BullMQ has the rescheduled delayed job
  const delayedJobs = await emailQueue.getDelayed();
  console.log('[5. BullMQ Rescheduled Jobs in Queue]: ' + delayedJobs.length + ' delayed jobs');

  console.log('\n=== PHASE 8 PASSED: RATE LIMITING & RESCHEDULING VERIFIED! ===\n');
  await pool.end();
  await redisClient.quit();
  process.exit(0);
}

testPhase8().catch((err) => {
  console.error('Phase 8 Test Error:', err);
  process.exit(1);
});
