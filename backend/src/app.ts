import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { healthRouter } from './routes/health.routes.js';
import { emailRouter } from './routes/email.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { slackRouter } from './routes/slack.routes.js';
import { searchRouter } from './routes/search.routes.js';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue } from './queues/email.queue.js';

export const createApp = (): Express => {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Basic request logging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[HTTP] ${req.method} ${req.path}`);
    next();
  });

  // BullMQ Live Dashboard (/admin/queues)
  const bullBoardAdapter = new ExpressAdapter();
  bullBoardAdapter.setBasePath('/admin/queues');
  createBullBoard({
    queues: [new BullMQAdapter(emailQueue)],
    serverAdapter: bullBoardAdapter,
  });
  app.use('/admin/queues', bullBoardAdapter.getRouter());

  // Health check endpoints
  app.use('/health', healthRouter);
  app.use('/api/health', healthRouter);

  // API Routes
  app.use('/api/emails', emailRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/slack', slackRouter);
  app.use('/api/search', searchRouter);

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Unhandled App Error]:', err);
    res.status(err.status || 500).json({
      error: {
        message: err.message || 'Internal Server Error',
        status: err.status || 500,
      },
    });
  });

  return app;
};

export const app = createApp();
