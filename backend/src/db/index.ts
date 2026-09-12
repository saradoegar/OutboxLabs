import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.warn('[PostgreSQL Pool] Unexpected error on idle client:', err.message);
});

export const query = async <T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> => {
  return pool.query<T>(text, params);
};

import { runDatabaseMigrations } from './migrate-schema.js';

export const initDb = async (): Promise<boolean> => {
  try {
    await runDatabaseMigrations();
    console.log('[PostgreSQL] Database schema & indexes initialized successfully');
    return true;
  } catch (err: any) {
    console.warn('[PostgreSQL] Database connection/init warning:', err.message);
    return false;
  }
};
