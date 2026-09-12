import { pool } from '../src/db/index.js';
import { emailQueue } from '../src/queues/email.queue.js';
import { v4 as uuidv4 } from 'uuid';

async function testPhase6() {
  console.log('=== PHASE 6: DUPLICATE & IDEMPOTENCY VERIFICATION TEST ===');

  const testKey = 'idemp_test_phase6_' + uuidv4();
  const futureDate = new Date(Date.now() + 15000).toISOString();

  const payload = {
    from: 'oliver.brown@domain.io',
    recipients: ['lead.idempotency@reachinbox.ai'],
    subject: 'Phase 6 Idempotency Verification Test',
    body: 'Testing duplicate payload handling and single execution guarantee.',
    scheduledAt: futureDate,
    delayBetweenEmails: 0,
    hourlyLimit: 100,
    idempotencyKey: testKey,
  };

  // 1. First Call
  console.log('Sending First Schedule Request...');
  const res1 = await fetch('http://localhost:5000/api/emails/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res1.ok) {
    throw new Error('First schedule call failed: ' + (await res1.text()));
  }
  const data1 = (await res1.json()) as any;
  console.log('[1. First Call Success]: Email ID: ' + data1.id + ', Status: ' + data1.status);

  // 2. Second Call with same idempotencyKey
  console.log('Sending Second Duplicate Request with identical idempotencyKey...');
  const res2 = await fetch('http://localhost:5000/api/emails/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res2.ok) {
    throw new Error('Second schedule call failed unexpectedly: ' + (await res2.text()));
  }
  const data2 = (await res2.json()) as any;
  console.log('[2. Second Call Handled]: Returned ID: ' + data2.id + ', duplicate detected: ' + data2.idempotentDuplicate);

  // 3. Verify exactly ONE database record exists with this idempotency key
  const dbCheck = await pool.query('SELECT * FROM emails WHERE idempotency_key = $1', [testKey]);
  console.log('[3. DB Record Count]: ' + dbCheck.rows.length + ' row(s) in PostgreSQL for key ' + testKey);
  if (dbCheck.rows.length !== 1) {
    throw new Error('Expected exactly 1 database record, found ' + dbCheck.rows.length);
  }

  // 4. Verify BullMQ queue contains exactly ONE delayed job for this email
  const delayedJobs = await emailQueue.getDelayed();
  const matchingJobs = delayedJobs.filter((j) => j.data.idempotencyKey === testKey);
  console.log('[4. BullMQ Delayed Jobs]: Found ' + matchingJobs.length + ' job(s) for this key');
  if (matchingJobs.length !== 1) {
    throw new Error('Expected exactly 1 BullMQ delayed job, found ' + matchingJobs.length);
  }

  // 5. Wait for target time and verify only 1 email is sent
  console.log('Waiting for scheduled send time and polling for single completion...');
  let finalRow: any = null;
  const pollStart = Date.now();
  while (Date.now() - pollStart < 35000) {
    const check = await pool.query('SELECT * FROM emails WHERE idempotency_key = $1', [testKey]);
    if (check.rows[0]?.status === 'sent') {
      finalRow = check.rows[0];
      break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (!finalRow) {
    throw new Error('Email was not marked sent within timeout!');
  }

  console.log('[5. Execution Verification]: Status is ' + finalRow.status + ', sent_at: ' + finalRow.sent_at);
  console.log('[6. Ethereal Preview URL]: ' + finalRow.ethereal_preview_url);

  // 6. Verify total records in DB for this idempotency key remains 1
  const dbFinalCount = await pool.query('SELECT COUNT(*) as count FROM emails WHERE idempotency_key = $1', [testKey]);
  console.log('[7. Final DB Count]: Exactly ' + dbFinalCount.rows[0].count + ' record exists in PostgreSQL');
  if (parseInt(dbFinalCount.rows[0].count, 10) !== 1) {
    throw new Error('Duplicate records were created!');
  }

  console.log('\n=== PHASE 6 PASSED ALL IDEMPOTENCY & DUPLICATE CHECKS! ===\n');
  await pool.end();
  process.exit(0);
}

testPhase6().catch((err) => {
  console.error('Phase 6 Test Error:', err);
  process.exit(1);
});
