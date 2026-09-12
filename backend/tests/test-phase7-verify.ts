import fs from 'fs';
import { pool } from '../src/db/index.js';

async function verify() {
  console.log('=== PHASE 7 VERIFY: POST-RESTART EXECUTION CHECK ===');

  if (!fs.existsSync('src/test-phase7-data.json')) {
    throw new Error('src/test-phase7-data.json not found!');
  }

  const { emailId, testKey, targetIso } = JSON.parse(fs.readFileSync('src/test-phase7-data.json', 'utf8'));
  console.log('Verifying Email ID: ' + emailId);
  console.log('Target Send Time was: ' + targetIso);

  // Poll DB until status is 'sent'
  console.log('Waiting for target scheduled time and polling for completion after restart...');
  let finalRow: any = null;
  const pollStart = Date.now();
  while (Date.now() - pollStart < 40000) {
    const check = await pool.query('SELECT * FROM emails WHERE id = $1', [emailId]);
    if (check.rows[0]?.status === 'sent') {
      finalRow = check.rows[0];
      break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (!finalRow) {
    const check = await pool.query('SELECT * FROM emails WHERE id = $1', [emailId]);
    finalRow = check.rows[0];
  }

  console.log('[1. DB Final Status]: ' + finalRow?.status);
  console.log('[2. Sent At Populated]: ' + finalRow?.sent_at);
  console.log('[3. Ethereal Preview URL]: ' + finalRow?.ethereal_preview_url);

  if (finalRow?.status !== 'sent') {
    throw new Error('Expected status sent after restart, got: ' + finalRow?.status);
  }
  if (!finalRow?.ethereal_preview_url) {
    throw new Error('Ethereal preview URL was not generated after restart!');
  }

  console.log('\n=== PHASE 7 PASSED: RESTART PERSISTENCE 100% VERIFIED! ===\n');
  await pool.end();
  process.exit(0);
}

verify().catch((err) => {
  console.error('Phase 7 Verify Error:', err);
  process.exit(1);
});
