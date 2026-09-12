import { app } from './app.js';
import { config } from './config/env.js';
import { initDb } from './db/index.js';

const startServer = async () => {
  console.log(`[Server] Starting in ${config.env} mode...`);

  // Initialize PostgreSQL Schema
  await initDb();

  // Start BullMQ worker unless explicitly disabled (e.g., when running dedicated worker container)
  if (process.env.DISABLE_WORKER !== 'true') {
    const { createEmailWorker } = await import('./workers/email.worker.js');
    createEmailWorker();
    console.log('[API Server] Background Email Worker initialized and listening to email-queue');
  }

  app.listen(config.port, () => {
    console.log(`[API Server] Running on port ${config.port}`);
    console.log(`[API Server] Health check available at http://localhost:${config.port}/health`);
  });
};

startServer().catch((err) => {
  console.error('[Server Fatal Error]:', err);
  process.exit(1);
});
