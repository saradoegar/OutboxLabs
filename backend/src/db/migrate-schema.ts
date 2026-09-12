import { pool } from './index.js';

export async function runDatabaseMigrations(): Promise<void> {
  console.log('[Database Migration] Ensuring required tables, columns, and indexes exist...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create or ensure emails table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS emails (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL DEFAULT 'default_user',
        tenant_id VARCHAR(64) NOT NULL DEFAULT 'default_tenant',
        sender VARCHAR(255) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'scheduled',
        scheduled_at TIMESTAMPTZ NULL,
        sent_at TIMESTAMPTZ NULL,
        failure_reason TEXT NULL,
        job_id VARCHAR(128) NULL,
        idempotency_key VARCHAR(128) UNIQUE NOT NULL,
        delay_between_emails_sec INT NOT NULL DEFAULT 0,
        hourly_limit INT NOT NULL DEFAULT 100,
        retry_count INT NOT NULL DEFAULT 0,
        ethereal_preview_url TEXT NULL,
        metadata JSONB NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Ensure columns exist if table was partially created
    const emailColumns = [
      { name: 'user_id', def: "VARCHAR(64) NOT NULL DEFAULT 'default_user'" },
      { name: 'tenant_id', def: "VARCHAR(64) NOT NULL DEFAULT 'default_tenant'" },
      { name: 'sender', def: "VARCHAR(255) NOT NULL DEFAULT ''" },
      { name: 'recipient', def: "VARCHAR(255) NOT NULL DEFAULT ''" },
      { name: 'subject', def: "TEXT NOT NULL DEFAULT ''" },
      { name: 'body', def: "TEXT NOT NULL DEFAULT ''" },
      { name: 'status', def: "VARCHAR(32) NOT NULL DEFAULT 'scheduled'" },
      { name: 'scheduled_at', def: 'TIMESTAMPTZ NULL' },
      { name: 'sent_at', def: 'TIMESTAMPTZ NULL' },
      { name: 'failure_reason', def: 'TEXT NULL' },
      { name: 'job_id', def: 'VARCHAR(128) NULL' },
      { name: 'idempotency_key', def: 'VARCHAR(128) NULL' },
      { name: 'delay_between_emails_sec', def: 'INT NOT NULL DEFAULT 0' },
      { name: 'hourly_limit', def: 'INT NOT NULL DEFAULT 100' },
      { name: 'retry_count', def: 'INT NOT NULL DEFAULT 0' },
      { name: 'ethereal_preview_url', def: 'TEXT NULL' },
      { name: 'metadata', def: 'JSONB NULL' },
      { name: 'created_at', def: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
      { name: 'updated_at', def: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
    ];

    for (const col of emailColumns) {
      await client.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'emails' AND column_name = '${col.name}'
          ) THEN
            ALTER TABLE emails ADD COLUMN ${col.name} ${col.def};
          END IF;
        END $$;
      `);
    }

    // 3. Ensure users table columns exist
    const userColumns = [
      { name: 'google_id', def: 'VARCHAR(128) NULL' },
      { name: 'avatar_url', def: 'TEXT NULL' },
      { name: 'access_token', def: 'TEXT NULL' },
      { name: 'refresh_token', def: 'TEXT NULL' },
      { name: 'created_at', def: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
      { name: 'updated_at', def: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
    ];
    for (const col of userColumns) {
      await client.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = '${col.name}'
          ) THEN
            ALTER TABLE users ADD COLUMN ${col.name} ${col.def};
          END IF;
        END $$;
      `);
    }

    // Relax legacy camelCase columns if present
    await client.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'createdAt') THEN
          ALTER TABLE users ALTER COLUMN "createdAt" DROP NOT NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updatedAt') THEN
          ALTER TABLE users ALTER COLUMN "updatedAt" DROP NOT NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'googleId') THEN
          ALTER TABLE users ALTER COLUMN "googleId" DROP NOT NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatarUrl') THEN
          ALTER TABLE users ALTER COLUMN "avatarUrl" DROP NOT NULL;
        END IF;
      END $$;
    `);

    // 4. Ensure slack_integrations table columns exist
    const slackColumns = [
      { name: 'user_id', def: "VARCHAR(64) NOT NULL DEFAULT 'default_user'" },
      { name: 'tenant_id', def: "VARCHAR(64) NOT NULL DEFAULT 'default_tenant'" },
      { name: 'team_id', def: "VARCHAR(64) NOT NULL DEFAULT 'default_team'" },
      { name: 'team_name', def: 'VARCHAR(255) NULL' },
      { name: 'bot_user_id', def: 'VARCHAR(64) NULL' },
      { name: 'access_token', def: "TEXT NOT NULL DEFAULT ''" },
      { name: 'scope', def: 'TEXT NULL' },
      { name: 'incoming_webhook_url', def: 'TEXT NULL' },
      { name: 'incoming_webhook_channel', def: 'TEXT NULL' },
      { name: 'channel_id', def: 'VARCHAR(64) NULL' },
      { name: 'is_active', def: 'BOOLEAN NOT NULL DEFAULT true' },
      { name: 'created_at', def: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
      { name: 'updated_at', def: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
    ];
    for (const col of slackColumns) {
      await client.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'slack_integrations' AND column_name = '${col.name}'
          ) THEN
            ALTER TABLE slack_integrations ADD COLUMN ${col.name} ${col.def};
          END IF;
        END $$;
      `);
    }

    // Make any legacy camelCase columns nullable so they don't block inserts
    await client.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'slack_integrations' AND column_name = 'userId') THEN
          ALTER TABLE slack_integrations ALTER COLUMN "userId" DROP NOT NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'slack_integrations' AND column_name = 'teamId') THEN
          ALTER TABLE slack_integrations ALTER COLUMN "teamId" DROP NOT NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'slack_integrations' AND column_name = 'accessToken') THEN
          ALTER TABLE slack_integrations ALTER COLUMN "accessToken" DROP NOT NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'slack_integrations' AND column_name = 'createdAt') THEN
          ALTER TABLE slack_integrations ALTER COLUMN "createdAt" DROP NOT NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'slack_integrations' AND column_name = 'updatedAt') THEN
          ALTER TABLE slack_integrations ALTER COLUMN "updatedAt" DROP NOT NULL;
        END IF;
      END $$;
    `);

    // 5. Create required indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
      CREATE INDEX IF NOT EXISTS idx_emails_scheduled_at ON emails(scheduled_at);
      CREATE INDEX IF NOT EXISTS idx_emails_job_id ON emails(job_id);
      CREATE INDEX IF NOT EXISTS idx_emails_idempotency_key ON emails(idempotency_key);
      CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
      CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_slack_user ON slack_integrations(user_id, is_active);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_slack_user_team ON slack_integrations(user_id, team_id);
    `);

    await client.query('COMMIT');
    console.log('[Database Migration] Migration successfully committed.');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[Database Migration] Failed:', err);
    throw err;
  } finally {
    client.release();
  }
}
