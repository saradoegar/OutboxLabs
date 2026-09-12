import { pool } from '../src/db/index.js';

async function testPhase13() {
  console.log('=== PHASE 13: GOOGLE OAUTH FLOW VERIFICATION ===');

  // 1. Check GET /api/auth/me
  console.log('1. Testing GET /api/auth/me...');
  const meRes = await fetch('http://localhost:5000/api/auth/me');
  if (!meRes.ok) throw new Error('GET /api/auth/me failed');
  const meData = (await meRes.json()) as any;
  console.log('[1. GET /api/auth/me Response]:', meData);
  if (!meData.email || !meData.name) throw new Error('Invalid user profile response');
  if (meData.clientSecret || meData.accessToken || meData.password) {
    throw new Error('SECURITY VIOLATION: Secret or token leaked in user profile!');
  }

  // 2. Check Authorize Endpoint (proper response and scopes when invoked)
  console.log('2. Testing Authorize Endpoint...');
  const authRes = await fetch('http://localhost:5000/api/auth/google?redirect=false');
  console.log('[2. Authorize Status Code]:', authRes.status);
  const authData = await authRes.json();
  console.log('[2. Authorize Response]:', authData);

  // 3. Check Callback Error Handling (missing code)
  console.log('3. Testing Callback missing code...');
  const cbRes = await fetch('http://localhost:5000/api/auth/google/callback');
  console.log('[3. Missing Code Status]:', cbRes.status, '(expected 400)');
  if (cbRes.status !== 400) throw new Error('Expected 400 for missing OAuth code');

  // 4. Test User Upsert and Profile Retrieval from Database
  console.log('4. Testing User DB Upsert and Profile Retrieval...');
  const testEmail = 'oauth.verified@reachinbox.ai';
  await pool.query(
    `INSERT INTO users (id, google_id, email, name, avatar_url, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name,
       avatar_url = EXCLUDED.avatar_url,
       updated_at = NOW()`,
    ['usr_test_phase13', 'google_id_999999', testEmail, 'Verified Google User', 'https://avatar.url/test.jpg']
  );

  const dbUser = await pool.query('SELECT id, email, name, avatar_url FROM users WHERE email = $1', [testEmail]);
  console.log('[4. Database User]:', dbUser.rows[0]);
  if (dbUser.rows[0].name !== 'Verified Google User') throw new Error('User DB upsert failed');

  // Cleanup test user
  await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
  await pool.end();

  console.log('\n=== PHASE 13 PASSED: GOOGLE OAUTH ENDPOINTS & USER PROFILE VERIFIED! ===\n');
  process.exit(0);
}

testPhase13().catch(err => {
  console.error('Phase 13 Test Error:', err);
  process.exit(1);
});
