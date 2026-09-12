import { initDb, pool } from './db/index.js';

async function run() {
  console.log('--- Initializing Database ---');
  await initDb();

  const tables = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log('Verified Tables:', tables.rows.map((r) => r.table_name));

  const indexes = await pool.query(
    "SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname"
  );
  console.log('Verified Indexes:');
  indexes.rows.forEach((r) => console.log(`  - ${r.tablename} -> ${r.indexname}`));

  await pool.end();
  console.log('Database initialization verified.');
}

run().catch((e) => {
  console.error('Failed to run migration:', e);
  process.exit(1);
});
