import { Router, Request, Response } from 'express';
import { slackService } from '../services/slack.service.js';
import { config } from '../config/env.js';

export const slackRouter = Router();

// 1. Start Slack OAuth Flow (supports both /oauth/start and /oauth/authorize)
const handleSlackOAuthStart = (req: Request, res: Response) => {
  try {
    if (!slackService.isOAuthConfigured()) {
      return res.status(400).json({
        error: {
          code: 'SLACK_OAUTH_NOT_CONFIGURED',
          message: 'Slack OAuth credentials are not configured in environment (SLACK_CLIENT_ID, SLACK_CLIENT_SECRET).',
        },
      });
    }

    const userId = (req.query.userId as string) || 'default_user';
    const authUrl = slackService.getAuthorizeUrl(userId);

    if (req.query.redirect === 'false') {
      return res.json({ url: authUrl, scopes: config.slack.scopes });
    }

    res.redirect(authUrl);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
};

slackRouter.get('/oauth/start', handleSlackOAuthStart);
slackRouter.get('/oauth/authorize', handleSlackOAuthStart);

// 2. Slack OAuth Callback Handler
slackRouter.get('/oauth/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const userId = (req.query.state as string) || 'default_user';

  if (!code) {
    return res.status(400).json({ error: { message: 'Missing Slack OAuth code parameter' } });
  }

  try {
    const tokenData = await slackService.exchangeCode(code);
    await slackService.saveIntegration(userId, tokenData);

    // Redirect to frontend dashboard with success flag
    const targetUrl = new URL(config.frontendUrl);
    targetUrl.searchParams.set('slack', 'connected');
    targetUrl.searchParams.set('team', tokenData.team?.name || 'Slack');
    res.redirect(targetUrl.toString());
  } catch (err: any) {
    console.error('[Slack Callback Error]:', err);
    res.redirect(`${config.frontendUrl}/?slack_error=${encodeURIComponent(err.message)}`);
  }
});

// 3. Slack Connection Status Endpoint (Safe, never exposes access tokens)
slackRouter.get('/status', async (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default_user';
  const status = await slackService.getStatus(userId);
  res.json(status);
});

// 4. Slack Disconnect Endpoint
slackRouter.post('/disconnect', async (req: Request, res: Response) => {
  const userId = (req.body.userId as string) || 'default_user';
  const success = await slackService.disconnect(userId);
  res.json({ success, message: success ? 'Slack disconnected' : 'Failed to disconnect' });
});

// 5. Test Notification Endpoint
slackRouter.post('/test-message', async (req: Request, res: Response) => {
  const { text, userId } = req.body;
  const sent = await slackService.sendMessage(
    text || '🧪 ReachInbox Slack integration test notification.',
    { userId: userId || 'default_user' }
  );

  if (!sent) {
    return res.status(502).json({
      error: {
        message: 'Could not deliver Slack message. Ensure Slack is connected via OAuth or SLACK_BOT_TOKEN/SLACK_CHANNEL_ID is set.',
      },
    });
  }

  res.json({ success: true, message: 'Message delivered to Slack' });
});
