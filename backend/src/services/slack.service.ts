import { config } from '../config/env.js';
import { query } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

export interface SlackOAuthAccessResult {
  ok: boolean;
  access_token?: string;
  token_type?: string;
  scope?: string;
  bot_user_id?: string;
  app_id?: string;
  team?: {
    name: string;
    id: string;
  };
  incoming_webhook?: {
    channel: string;
    channel_id: string;
    configuration_url: string;
    url: string;
  };
  error?: string;
}

export const slackService = {
  isOAuthConfigured(): boolean {
    return Boolean(config.slack.clientId && config.slack.clientSecret);
  },

  isLocalBotConfigured(): boolean {
    return Boolean(config.slack.botToken && config.slack.channelId);
  },

  getAuthorizeUrl(userId: string = 'default_user'): string {
    if (!this.isOAuthConfigured()) {
      throw new Error(
        'Slack OAuth credentials are not configured in environment (SLACK_CLIENT_ID, SLACK_CLIENT_SECRET).'
      );
    }

    const rootUrl = 'https://slack.com/oauth/v2/authorize';
    const params = new URLSearchParams({
      client_id: config.slack.clientId,
      scope: config.slack.scopes,
      redirect_uri: config.slack.redirectUri,
      state: userId,
    });

    return `${rootUrl}?${params.toString()}`;
  },

  async exchangeCode(code: string): Promise<SlackOAuthAccessResult> {
    if (!this.isOAuthConfigured()) {
      throw new Error('Slack OAuth credentials are not configured in environment.');
    }

    const tokenUrl = 'https://slack.com/api/oauth.v2.access';
    const body = new URLSearchParams({
      code,
      client_id: config.slack.clientId,
      client_secret: config.slack.clientSecret,
      redirect_uri: config.slack.redirectUri,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = (await response.json()) as SlackOAuthAccessResult;
    if (!data.ok) {
      throw new Error(`Slack OAuth exchange error: ${data.error || 'Unknown error'}`);
    }

    return data;
  },

  async saveIntegration(userId: string, oauthData: SlackOAuthAccessResult): Promise<void> {
    const teamId = oauthData.team?.id || 'unknown_team';
    const teamName = oauthData.team?.name || 'Slack Workspace';
    const botUserId = oauthData.bot_user_id || null;
    const accessToken = oauthData.access_token || '';
    const scope = oauthData.scope || null;
    const webhookUrl = oauthData.incoming_webhook?.url || null;
    const webhookChannel = oauthData.incoming_webhook?.channel || null;
    const channelId = oauthData.incoming_webhook?.channel_id || null;

    const sql = `
      INSERT INTO slack_integrations (
        id, user_id, tenant_id, team_id, team_name, bot_user_id,
        access_token, scope, incoming_webhook_url, incoming_webhook_channel,
        channel_id, is_active, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW()
      )
      ON CONFLICT (user_id, team_id) DO UPDATE SET
        team_name = EXCLUDED.team_name,
        bot_user_id = EXCLUDED.bot_user_id,
        access_token = EXCLUDED.access_token,
        scope = EXCLUDED.scope,
        incoming_webhook_url = EXCLUDED.incoming_webhook_url,
        incoming_webhook_channel = EXCLUDED.incoming_webhook_channel,
        channel_id = EXCLUDED.channel_id,
        is_active = true,
        updated_at = NOW()
    `;

    await query(sql, [
      uuidv4(),
      userId,
      'default_tenant',
      teamId,
      teamName,
      botUserId,
      accessToken,
      scope,
      webhookUrl,
      webhookChannel,
      channelId,
    ]);
  },

  async getStatus(userId: string = 'default_user'): Promise<{
    connected: boolean;
    teamName?: string;
    channel?: string;
  }> {
    try {
      const res = await query(
        `SELECT team_name, incoming_webhook_channel, channel_id 
         FROM slack_integrations 
         WHERE user_id = $1 AND is_active = true 
         ORDER BY updated_at DESC LIMIT 1`,
        [userId]
      );

      if (res.rows.length > 0) {
        return {
          connected: true,
          teamName: res.rows[0].team_name,
          channel: res.rows[0].incoming_webhook_channel || res.rows[0].channel_id || 'default',
        };
      }
    } catch {
      // DB query failure or table not ready
    }

    // Fallback status check for local verification
    if (this.isLocalBotConfigured()) {
      return {
        connected: true,
        teamName: 'Local Bot Token Configured',
        channel: config.slack.channelId,
      };
    }

    return { connected: false };
  },

  async disconnect(userId: string = 'default_user'): Promise<boolean> {
    try {
      await query(
        `UPDATE slack_integrations SET is_active = false, updated_at = NOW() WHERE user_id = $1`,
        [userId]
      );
      return true;
    } catch {
      return false;
    }
  },

  async sendMessage(
    text: string,
    options: { userId?: string; blocks?: any[] } = {}
  ): Promise<boolean> {
    const userId = options.userId || 'default_user';

    // 1. Try User's OAuth Integration
    try {
      const res = await query(
        `SELECT access_token, incoming_webhook_url, channel_id 
         FROM slack_integrations 
         WHERE user_id = $1 AND is_active = true 
         ORDER BY updated_at DESC LIMIT 1`,
        [userId]
      );

      if (res.rows.length > 0) {
        const { access_token, incoming_webhook_url, channel_id } = res.rows[0];

        if (incoming_webhook_url) {
          const whRes = await fetch(incoming_webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, blocks: options.blocks }),
          });
          if (whRes.ok) return true;
        }

        if (access_token && channel_id) {
          const apiRes = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify({
              channel: channel_id,
              text,
              blocks: options.blocks,
            }),
          });
          const apiData = (await apiRes.json()) as any;
          if (apiData.ok) return true;
        }
      }
    } catch (e: any) {
      console.warn('[Slack Service] Failed to send via OAuth integration:', e.message);
    }

    // 2. Fallback to local bot token for verification
    if (this.isLocalBotConfigured()) {
      try {
        const fallbackRes = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.slack.botToken}`,
          },
          body: JSON.stringify({
            channel: config.slack.channelId,
            text,
            blocks: options.blocks,
          }),
        });
        const fallbackData = (await fallbackRes.json()) as any;
        return fallbackData.ok;
      } catch (err: any) {
        console.warn('[Slack Service] Fallback bot token send error:', err.message);
      }
    }

    return false;
  },

  async sendRateLimitAlert(details: {
    limit: number;
    emailId: string;
    recipient: string;
    subject: string;
    rescheduledTo: Date;
    userId?: string;
  }): Promise<boolean> {
    const message = `⚠️ *ReachInbox Rate Limit Alert*\n• *Hourly Limit Reached:* ${details.limit} emails/hour\n• *Email:* ${details.subject} (${details.emailId})\n• *Recipient:* ${details.recipient}\n• *Action:* Successfully postponed to next available slot (${details.rescheduledTo.toISOString()}). No jobs dropped.`;
    return this.sendMessage(message, { userId: details.userId });
  },
};
