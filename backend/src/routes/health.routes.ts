import { Router, Request, Response } from 'express';
import { pool } from '../db/index.js';
import { redisClient } from '../config/redis.js';
import { emailQueue } from '../queues/email.queue.js';
import { elasticsearchService } from '../services/elasticsearch.service.js';
import { config } from '../config/env.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';
  let esStatus = 'disconnected';
  let queueMetrics: any = null;

  // 1. Test PostgreSQL connectivity
  try {
    const dbRes = await pool.query('SELECT 1 as ping');
    if (dbRes.rows.length > 0) dbStatus = 'connected';
  } catch (e: any) {
    dbStatus = `error: ${e.message}`;
  }

  // 2. Test Redis connectivity
  try {
    const pong = await redisClient.ping();
    if (pong === 'PONG') redisStatus = 'connected';
  } catch (e: any) {
    redisStatus = `error: ${e.message}`;
  }

  // 3. Test BullMQ metrics
  try {
    const [waiting, active, delayed, completed, failed] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getDelayedCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
    ]);
    queueMetrics = { waiting, active, delayed, completed, failed };
  } catch (e: any) {
    queueMetrics = { error: e.message };
  }

  // 4. Test Elasticsearch connectivity
  try {
    const esHealthy = await elasticsearchService.isHealthy();
    esStatus = esHealthy ? 'connected' : 'unreachable';
  } catch (e: any) {
    esStatus = `error: ${e.message}`;
  }

  // 5. Check SMTP configuration
  const smtpConfig = {
    configured: Boolean(config.ethereal.user && config.ethereal.password),
    host: config.ethereal.host,
    port: config.ethereal.port,
    mode: config.ethereal.user ? 'custom_ethereal' : 'auto_disposable_ethereal',
  };

  res.json({
    status: 'ok',
    service: 'reachinbox-email-scheduler',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    dependencies: {
      database: dbStatus,
      redis: redisStatus,
      bullmq: queueMetrics,
      elasticsearch: esStatus,
      smtp: smtpConfig,
    },
  });
});
