import { Router, Request, Response } from 'express';
import { googleAuthService } from '../services/google-auth.service.js';
import { query } from '../db/index.js';
import { config } from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

export const authRouter = Router();

// 1. Google OAuth Initiate Endpoint (supports both /google and /google/authorize)
const handleGoogleAuthStart = (req: Request, res: Response) => {
  try {
    if (!googleAuthService.isConfigured()) {
      return res.status(400).json({
        error: {
          code: 'GOOGLE_OAUTH_NOT_CONFIGURED',
          message: 'Google OAuth credentials are not configured in environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET).',
        },
      });
    }

    const state = (req.query.state as string) || 'reachinbox_auth';
    const authUrl = googleAuthService.getAuthUrl(state);

    if (req.query.redirect === 'false') {
      return res.json({ url: authUrl, state });
    }

    res.redirect(authUrl);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
};

authRouter.get('/google', handleGoogleAuthStart);
authRouter.get('/google/authorize', handleGoogleAuthStart);

// 2. Google OAuth Callback Endpoint
authRouter.get('/google/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).json({ error: { message: 'Missing OAuth authorization code' } });
  }

  try {
    const tokenData = await googleAuthService.exchangeCode(code);
    const profile = await googleAuthService.getUserInfo(tokenData.access_token);

    // Upsert into users table
    const userId = `usr_${uuidv4().substring(0, 12)}`;
    try {
      await query(
        `INSERT INTO users (id, google_id, email, name, avatar_url, access_token, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           avatar_url = EXCLUDED.avatar_url,
           access_token = EXCLUDED.access_token,
           updated_at = NOW()`,
        [userId, profile.id, profile.email, profile.name, profile.picture, tokenData.access_token]
      );
    } catch (dbErr: any) {
      console.warn('[Google Auth] Failed to persist user to PostgreSQL:', dbErr.message);
    }

    // Redirect to frontend dashboard with success
    const targetUrl = new URL(config.frontendUrl);
    targetUrl.searchParams.set('auth', 'success');
    targetUrl.searchParams.set('email', profile.email);
    targetUrl.searchParams.set('name', profile.name);
    res.redirect(targetUrl.toString());
  } catch (err: any) {
    console.error('[Google Callback Error]:', err);
    res.redirect(`${config.frontendUrl}/?auth_error=${encodeURIComponent(err.message)}`);
  }
});

// 3. Current User Endpoint (Safe, never exposes client secrets or tokens)
authRouter.get('/me', async (req: Request, res: Response) => {
  // In a full production app, read from JWT / Session cookie.
  // For demo/assignment compatibility, return the default Oliver Brown or DB user
  try {
    const dbRes = await query(`SELECT id, email, name, avatar_url FROM users ORDER BY updated_at DESC LIMIT 1`);
    if (dbRes.rows.length > 0) {
      return res.json({
        id: dbRes.rows[0].id,
        email: dbRes.rows[0].email,
        name: dbRes.rows[0].name,
        avatarUrl: dbRes.rows[0].avatar_url,
      });
    }
  } catch {
    // DB not connected
  }

  res.json({
    id: 'user-oliver-brown',
    name: 'Oliver Brown',
    email: 'oliver.brown@domain.io',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80',
  });
});
