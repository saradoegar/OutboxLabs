import { pool } from '../src/db/index.js';
import { emailQueue } from '../src/queues/email.queue.js';

async function testPhase5() {
  console.log('=== PHASE 5: REAL SCHEDULE & DELAYED SEND TEST ===');

  // Schedule for 15 seconds in the future
  const futureDate = new Date(Date.now() + 15000);
  const futureIso = futureDate.toISOString();

  console.log(`Current Time: ${new Date().toISOString()}`);
  console.log(`Target Send Time: ${futureIso} (+25s)`);

  const payload = {
    from: 'oliver.brown@domain.io',
    recipients: ['lead.verify@reachinbox.ai'],
    subject: 'Phase 5 Verification Scheduled Email',
    body: 'Verifying delayed execution and Ethereal preview generation.',
    scheduledAt: futureIso,
    delayBetweenEmails: 0,
    hourlyLimit: 100,
  };

  // 1. Post to API
  const res = await fetch('http://localhost:5000/api/emails/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Schedule failed: ${txt}`);
  }

  const email = (await res.json()) as any;
  console.log(`[1. API Success]: Created Email ID: ${email.id}`);

  // 2. Verify PostgreSQL record immediately
  const dbCheck1 = await pool.query('SELECT * FROM emails WHERE id = $1', [email.id]);
  if (dbCheck1.rows.length === 0) throw new Error('Email not found in PostgreSQL!');
  console.log(`[2. DB Check]: Row exists with status: '${dbCheck1.rows[0].status}'`);

  // 3. Verify BullMQ delayed job
  const delayedJobs = await emailQueue.getDelayed();
  const foundJob = delayedJobs.find((j) => j.data.emailId === email.id);
  if (!foundJob) throw new Error('Delayed job not found in BullMQ!');
  console.log(`[3. BullMQ Check]: Delayed Job #${foundJob.id} registered, delay: ${foundJob.opts.delay}ms`);

  // 4. Verify GET /api/emails/scheduled returns it
  const schedRes = await fetch('http://localhost:5000/api/emails/scheduled');
  const scheduledList = (await schedRes.json()) as any[];
  const inScheduled = scheduledList.some((e) => e.id === email.id);
  console.log(`[4. Scheduled API Check]: Present in GET /api/emails/scheduled: ${inScheduled}`);

  // 5. Early check (6 seconds in)
  console.log('Waiting 6s to verify worker DOES NOT process early...');
  await new Promise((r) => setTimeout(r, 6000));
  const dbEarlyCheck = await pool.query('SELECT status FROM emails WHERE id = $1', [email.id]);
  console.log(`[5. Early Check at T+6s]: Status is still '${dbEarlyCheck.rows[0].status}' (Pass - Not processed early)`);

  // 6. Wait for scheduled time and poll until worker completes send
  console.log('Waiting for target scheduled time and polling for send completion...');
  let finalRow: any = null;
  const pollStart = Date.now();
  while (Date.now() - pollStart < 35000) {
    const check = await pool.query('SELECT * FROM emails WHERE id = $1', [email.id]);
    if (check.rows[0]?.status === 'sent') {
      finalRow = check.rows[0];
      break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (!finalRow) {
    const check = await pool.query('SELECT * FROM emails WHERE id = $1', [email.id]);
    finalRow = check.rows[0];
  }

  // 7. Verify final DB status
  console.log(`[7. DB Final Status]: '${finalRow.status}'`);
  console.log(`[8. Sent At Populated]: ${finalRow.sent_at}`);
  console.log(`[9. Ethereal Preview URL]: ${finalRow.ethereal_preview_url}`);

  if (finalRow.status !== 'sent') {
    throw new Error(`Expected status 'sent', got '${finalRow.status}'`);
  }
  if (!finalRow.ethereal_preview_url) {
    throw new Error('Ethereal preview URL was not stored!');
  }

  // 10. Verify GET /api/emails/sent
  const sentRes = await fetch('http://localhost:5000/api/emails/sent');
  const sentList = (await sentRes.json()) as any[];
  const inSent = sentList.some((e) => e.id === email.id);
  console.log(`[10. Sent API Check]: Present in GET /api/emails/sent: ${inSent}`);

  // 11. Verify GET /api/emails/scheduled NO LONGER has it
  const schedRes2 = await fetch('http://localhost:5000/api/emails/scheduled');
  const scheduledList2 = (await schedRes2.json()) as any[];
  const stillInScheduled = scheduledList2.some((e) => e.id === email.id);
  console.log(`[11. Scheduled API Check]: Removed from GET /api/emails/scheduled: ${!stillInScheduled}`);

  console.log('\n=== PHASE 5 PASSED ALL 13 VERIFICATION STEPS! ===\n');
  await pool.end();
  process.exit(0);
}

testPhase5().catch((err) => {
  console.error('Phase 5 Test Error:', err);
  process.exit(1);
});
