import { pool } from '../src/db/index.js';
import { v4 as uuidv4 } from 'uuid';

async function testPhase9() {
  console.log('=== PHASE 9: DELAY BETWEEN EMAILS VERIFICATION TEST ===');

  const delaySec = 3;
  const uniqueSubject = 'Phase 9 Delay Enforcement Test ' + uuidv4();
  const payload = {
    from: 'oliver.brown@domain.io',
    recipients: [
      'delay.recipient1@reachinbox.ai',
      'delay.recipient2@reachinbox.ai',
    ],
    subject: uniqueSubject,
    body: 'Verifying minimum delay between consecutive emails.',
    scheduledAt: null,
    delayBetweenEmails: delaySec,
    hourlyLimit: 100,
  };

  const res = await fetch('http://localhost:5000/api/emails/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Schedule failed: ' + (await res.text()));

  // Fetch the 2 emails created for this subject
  const dbRes = await pool.query(
    'SELECT id, recipient, status, scheduled_at, sent_at FROM emails WHERE subject = $1 ORDER BY created_at ASC, id ASC',
    [uniqueSubject]
  );

  const emails = dbRes.rows;
  console.log('Found ' + emails.length + ' emails scheduled for Phase 9 test:', emails.map(e => ({ id: e.id, recipient: e.recipient, status: e.status })));
  if (emails.length < 2) throw new Error('Expected 2 emails created');

  const email1Id = emails[0].id;
  const email2Id = emails[1].id;

  // Poll until both emails are sent
  console.log('Waiting for both emails to be sent through worker (enforcing >= ' + delaySec + 's spacing)...');
  let email1Row: any = null;
  let email2Row: any = null;
  const start = Date.now();

  while (Date.now() - start < 35000) {
    const check1 = await pool.query('SELECT * FROM emails WHERE id = $1', [email1Id]);
    const check2 = await pool.query('SELECT * FROM emails WHERE id = $1', [email2Id]);

    if (check1.rows[0]?.status === 'sent') email1Row = check1.rows[0];
    if (check2.rows[0]?.status === 'sent') email2Row = check2.rows[0];

    if (email1Row && email2Row) break;
    await new Promise(r => setTimeout(r, 1500));
  }

  if (!email1Row || !email2Row) {
    throw new Error('One or both emails did not reach sent status within timeout');
  }

  const sentAt1 = new Date(email1Row.sent_at).getTime();
  const sentAt2 = new Date(email2Row.sent_at).getTime();
  const diffSec = (sentAt2 - sentAt1) / 1000;

  console.log('[Email 1 Sent At]: ' + email1Row.sent_at + ' (timestamp: ' + sentAt1 + ')');
  console.log('[Email 2 Sent At]: ' + email2Row.sent_at + ' (timestamp: ' + sentAt2 + ')');
  console.log('[Time Difference]: ' + diffSec + ' seconds (expected >= ' + delaySec + ' seconds)');

  if (diffSec < 2.5) { // allow 500ms jitter
    throw new Error('Difference between sends (' + diffSec + 's) is less than required delay (' + delaySec + 's)');
  }

  console.log('[Email 1 Preview URL]: ' + email1Row.ethereal_preview_url);
  console.log('[Email 2 Preview URL]: ' + email2Row.ethereal_preview_url);

  console.log('\n=== PHASE 9 PASSED: DELAY BETWEEN EMAILS VERIFIED! ===\n');
  await pool.end();
  process.exit(0);
}

testPhase9().catch(err => {
  console.error('Phase 9 Test Error:', err);
  process.exit(1);
});
