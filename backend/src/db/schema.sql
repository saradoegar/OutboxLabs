-- PostgreSQL Relational Schema for ReachInbox Email Scheduler

-- Enum for email status
DO $$ BEGIN
    CREATE TYPE email_status AS ENUM ('scheduled', 'queued', 'sent', 'failed', 'rescheduled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    google_id VARCHAR(128) UNIQUE NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NULL,
    avatar_url TEXT NULL,
    access_token TEXT NULL,
    refresh_token TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Slack OAuth Integrations Table (stores authorization per user / tenant)
CREATE TABLE IF NOT EXISTS slack_integrations (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL DEFAULT 'default_user',
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'default_tenant',
    team_id VARCHAR(64) NOT NULL,
    team_name VARCHAR(255) NULL,
    bot_user_id VARCHAR(64) NULL,
    access_token TEXT NOT NULL,
    scope TEXT NULL,
    incoming_webhook_url TEXT NULL,
    incoming_webhook_channel TEXT NULL,
    channel_id VARCHAR(64) NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_team UNIQUE (user_id, team_id)
);

-- Emails Table
CREATE TABLE IF NOT EXISTS emails (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL DEFAULT 'default_user',
    tenant_id VARCHAR(64) NOT NULL DEFAULT 'default_tenant',
    sender VARCHAR(255) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status email_status NOT NULL DEFAULT 'scheduled',
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

-- Indexes for performance & query lookups
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_scheduled_at ON emails(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_emails_job_id ON emails(job_id);
CREATE INDEX IF NOT EXISTS idx_emails_idempotency_key ON emails(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slack_user ON slack_integrations(user_id, is_active);
