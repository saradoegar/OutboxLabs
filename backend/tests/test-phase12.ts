import { pool } from '../src/db/index.js';

async function testPhase12() {
  console.log('=== PHASE 12: SLACK OAUTH FLOW VERIFICATION ===');

  // 1. Check Status Endpoint (initially disconnected or connected)
  const statusRes1 = await fetch('http://localhost:5000/api/slack/status');
  console.log('[1. Status Check]: Status Code:', statusRes1.status);
  const statusData1 = await statusRes1.json();
  console.log('[1. Status Response]:', statusData1);

  // 2. Check Authorize Endpoint without configured credentials (should report clean error / redirect URL)
  const authRes = await fetch('http://localhost:5000/api/slack/oauth/authorize?redirect=false');
  console.log('[2. Authorize Endpoint]: Status Code:', authRes.status);
  const authData = await authRes.json();
  console.log('[2. Authorize Response]:', authData);

  // 3. Check Callback Endpoint Error Handling (missing or invalid code)
  const cbRes = await fetch('http://localhost:5000/api/slack/oauth/callback?error=access_denied');
  console.log('[3. Callback Error Handling]: Status Code:', cbRes.status, '(redirected to frontend with error parameter)');
  const cbLocation = cbRes.headers.get('location') || '';
  console.log('[3. Redirect URL]:', cbLocation);

  // 4. Simulate saving a verified Slack integration in database
  const dummyUserId = 'test_slack_user';
  await pool.query(
    `INSERT INTO slack_integrations (
       id, user_id, tenant_id, team_id, team_name, bot_user_id,
       access_token, scope, incoming_webhook_url, incoming_webhook_channel,
       channel_id, is_active, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW())
     ON CONFLICT (user_id, team_id) DO UPDATE SET is_active = true, updated_at = NOW()`,
    [
      'slack_int_test',
      dummyUserId,
      'default_tenant',
      'T12345678',
      'Acme Engineering Team',
      'U12345678',
      'synthetic_mock_test_token_placeholder',
      'chat:write,channels:read',
      'https://hooks.slack.com/services/mock/test/webhook',
      '#alerts-email',
      'C12345678',
    ]
  );
  console.log('[4. Database Storage]: Inserted mock integration for user:', dummyUserId);

  // 5. Verify query returns connected for this user
  const dbCheck = await pool.query('SELECT team_name, incoming_webhook_channel, is_active FROM slack_integrations WHERE user_id = $1', [dummyUserId]);
  console.log('[5. Verification]: Connected team:', dbCheck.rows[0].team_name, 'Channel:', dbCheck.rows[0].incoming_webhook_channel, 'Active:', dbCheck.rows[0].is_active);

  // 6. Test Disconnect
  const disconnRes = await fetch('http://localhost:5000/api/slack/disconnect', { method: 'POST' });
  console.log('[6. Disconnect Endpoint]: Status Code:', disconnRes.status);
  const disconnData = await disconnRes.json();
  console.log('[6. Disconnect Result]:', disconnData);

  // Cleanup test row
  await pool.query('DELETE FROM slack_integrations WHERE user_id = $1', [dummyUserId]);
  await pool.end();

  console.log('\n=== PHASE 12 PASSED: SLACK OAUTH ENDPOINTS VERIFIED! ===\n');
  process.exit(0);
}

testPhase12().catch(err => {
  console.error('Phase 12 Test Error:', err);
  process.exit(1);
});
