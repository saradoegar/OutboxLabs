import dotenv from 'dotenv';
import path from 'path';

import fs from 'fs';

// Look for .env in current directory, and fallback to parent directory if in backend/
const localEnvPath = path.resolve(process.cwd(), '.env');
const parentEnvPath = path.resolve(process.cwd(), '../.env');

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else if (fs.existsSync(parentEnvPath)) {
  dotenv.config({ path: parentEnvPath });
} else {
  dotenv.config();
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/reachinbox',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  ethereal: {
    host: process.env.ETHEREAL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.ETHEREAL_PORT || '587', 10),
    user: process.env.ETHEREAL_USER || '',
    password: process.env.ETHEREAL_PASSWORD || '',
  },

  email: {
    from: process.env.EMAIL_FROM || 'ReachInbox Scheduler <scheduler@reachinbox.ai>',
    delayMs: parseInt(process.env.EMAIL_DELAY_MS || '2000', 10), // minimum delay between sends
    maxEmailsPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR || '100', 10), // hourly limit
    workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  },

  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    username: process.env.ELASTICSEARCH_USERNAME || '',
    password: process.env.ELASTICSEARCH_PASSWORD || '',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      process.env.GOOGLE_REDIRECT_URI ||
      'http://localhost:5000/api/auth/google/callback',
  },

  slack: {
    clientId: process.env.SLACK_CLIENT_ID || '',
    clientSecret: process.env.SLACK_CLIENT_SECRET || '',
    redirectUri:
      process.env.SLACK_REDIRECT_URI ||
      'http://localhost:5000/api/slack/oauth/callback',
    scopes:
      process.env.SLACK_SCOPES ||
      'chat:write,channels:read,chat:write.public',
    botToken: process.env.SLACK_BOT_TOKEN || '',
    channelId: process.env.SLACK_CHANNEL_ID || '',
  },
};
