import { config } from '../config/env.js';

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export const googleAuthService = {
  isConfigured(): boolean {
    return Boolean(config.google.clientId && config.google.clientSecret);
  },

  getAuthUrl(state: string = 'google_oauth'): string {
    if (!this.isConfigured()) {
      throw new Error('Google OAuth credentials are not configured in environment (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET).');
    }

    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      client_id: config.google.clientId,
      redirect_uri: config.google.callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `${rootUrl}?${params.toString()}`;
  },

  async exchangeCode(code: string): Promise<{ access_token: string; refresh_token?: string; id_token?: string }> {
    if (!this.isConfigured()) {
      throw new Error('Google OAuth credentials are not configured in environment.');
    }

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const body = new URLSearchParams({
      code,
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      redirect_uri: config.google.callbackUrl,
      grant_type: 'authorization_code',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google token exchange failed: ${errorText}`);
    }

    return (await response.json()) as { access_token: string; refresh_token?: string; id_token?: string };
  },

  async getUserInfo(accessToken: string): Promise<GoogleUserProfile> {
    const userInfoUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';
    const response = await fetch(userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Google user profile with access token.');
    }

    const data = (await response.json()) as any;
    return {
      id: data.sub,
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  },
};
