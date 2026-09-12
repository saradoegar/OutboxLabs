import fs from 'fs';
import { pool } from '../src/db/index.js';
import { emailQueue } from '../src/queues/email.queue.js';
import { v4 as uuidv4 } from 'uuid';

async function prepare() {
  console.log('=== PHASE 7 PREPARE: SCHEDULE EMAIL BEFORE RESTART ===');

  const testKey = 'idemp_test_phase7_' + uuidv4();
  // Schedule for 35 seconds from now
  const targetTime = new Date(Date.now() + 35000);
  const targetIso = targetTime.toISOString();

  console.log('Current Time: ' + new Date().toISOString());
  console.log('Target Send Time: ' + targetIso + ' (+35s)');

  const payload = {
    from: 'oliver.brown@domain.io',
    recipients: ['persistence.verify@reachinbox.ai'],
    subject: 'Phase 7 Persistence Across Restart Test',
    body: 'Verifying delayed jobs survive API and worker restart without loss.',
    scheduledAt: targetIso,
    delayBetweenEmails: 0,
    hourlyLimit: 100,
    idempotencyKey: testKey,
  };

  const res = await fetch('http://localhost:5000/api/emails/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Schedule failed: ' + (await res.text()));
  }

  const email = (await res.json()) as any;
  console.log('[1. API Success]: Created Email ID: ' + email.id);

  // Verify delayed job exists in BullMQ
  const delayedJobs = await emailQueue.getDelayed();
  const found = delayedJobs.find((j) => j.data.emailId === email.id);
  if (!found) throw new Error('Delayed job not found in BullMQ before restart!');
  console.log('[2. BullMQ Verified]: Job #' + found.id + ' registered in Redis with delay ' + found.opts.delay + 'ms');

  // Save info for verification step
  fs.writeFileSync('src/test-phase7-data.json', JSON.stringify({
    emailId: email.id,
    testKey,
    targetIso,
    jobId: found.id,
  }, null, 2));

  console.log('Saved Phase 7 test data. Ready for shutdown.');
  await pool.end();
  process.exit(0);
}

prepare().catch((err) => {
  console.error(err);
  process.exit(1);
});
