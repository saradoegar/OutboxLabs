async function testPhase10() {
  console.log('=== PHASE 10: ELASTICSEARCH INTEGRATION & SEARCH TEST ===');

  // Refresh index
  await fetch('http://localhost:9200/emails/_refresh', { method: 'POST' });

  // 1. Search by Subject Keyword
  console.log('1. Testing search by subject keyword: "Verification"...');
  const res1 = await fetch('http://localhost:5000/api/search?q=Verification');
  if (!res1.ok) throw new Error('Search failed: ' + (await res1.text()));
  const data1 = (await res1.json()) as any;
  console.log('[1. Subject Search]: Found ' + data1.total + ' results for "Verification"');
  if (data1.total === 0) throw new Error('Expected results for "Verification"');

  // 2. Search by Recipient
  console.log('2. Testing search by recipient: "reachinbox.ai"...');
  const res2 = await fetch('http://localhost:5000/api/search?q=reachinbox.ai');
  if (!res2.ok) throw new Error('Search failed: ' + (await res2.text()));
  const data2 = (await res2.json()) as any;
  console.log('[2. Recipient Search]: Found ' + data2.total + ' results for "reachinbox.ai"');
  if (data2.total === 0) throw new Error('Expected results for recipient domain');

  // 3. Search by Body text snippet
  console.log('3. Testing search by body snippet: "preview generation"...');
  const res3 = await fetch('http://localhost:5000/api/search?q=preview+generation');
  if (!res3.ok) throw new Error('Search failed: ' + (await res3.text()));
  const data3 = (await res3.json()) as any;
  console.log('[3. Body Search]: Found ' + data3.total + ' results for "preview generation"');
  if (data3.total === 0) throw new Error('Expected results for body text');

  // 4. Edge Case: Empty Query
  console.log('4. Testing Edge Case: Empty query parameter...');
  const resEmpty = await fetch('http://localhost:5000/api/search?q=');
  console.log('[4. Empty Search Status]: ' + resEmpty.status + ' (expected 400)');
  if (resEmpty.status !== 400) throw new Error('Expected 400 for empty search query');

  // 5. Edge Case: No Matches
  console.log('5. Testing Edge Case: Non-existent search query...');
  const resNoMatch = await fetch('http://localhost:5000/api/search?q=xyznonexistenttoken999');
  const dataNoMatch = (await resNoMatch.json()) as any;
  console.log('[5. No Match Search Total]: ' + dataNoMatch.total + ' results (expected 0)');
  if (dataNoMatch.total !== 0) throw new Error('Expected 0 results for non-existent token');

  // 6. Edge Case: Special Characters
  console.log('6. Testing Edge Case: Special characters...');
  const resSpecial = await fetch('http://localhost:5000/api/search?q=' + encodeURIComponent('!@#$%^&*()_+'));
  console.log('[6. Special Character Search Status]: ' + resSpecial.status);

  console.log('\n=== PHASE 10 PASSED: ELASTICSEARCH SEARCH VERIFIED! ===\n');
  process.exit(0);
}

testPhase10().catch(err => {
  console.error('Phase 10 Test Error:', err);
  process.exit(1);
});
