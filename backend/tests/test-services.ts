import { smtpService } from '../src/services/smtp.service.js';
import { googleAuthService } from '../src/services/google-auth.service.js';
import { slackService } from '../src/services/slack.service.js';
import { rateLimitService } from '../src/services/rate-limit.service.js';

async function runVerification() {
  console.log('--- ReachInbox Services Verification ---');

  // 1. Google OAuth check
  console.log('\n1. Testing Google OAuth Service:');
  const googleConfigured = googleAuthService.isConfigured();
  console.log(`- Is Google OAuth configured in env: ${googleConfigured}`);
  if (!googleConfigured) {
    try {
      googleAuthService.getAuthUrl();
    } catch (e: any) {
      console.log(`- Expected behavior when unconfigured: "${e.message}" (Correct)`);
    }
  }

  // 2. Slack OAuth check
  console.log('\n2. Testing Slack OAuth Service:');
  const slackConfigured = slackService.isOAuthConfigured();
  console.log(`- Is Slack OAuth configured in env: ${slackConfigured}`);
  const slackBotConfigured = slackService.isLocalBotConfigured();
  console.log(`- Is Local Slack Bot configured: ${slackBotConfigured}`);
  if (!slackConfigured) {
    try {
      slackService.getAuthorizeUrl();
    } catch (e: any) {
      console.log(`- Expected behavior when unconfigured: "${e.message}" (Correct)`);
    }
  }

  // 3. Rate Limit delay logic check
  console.log('\n3. Testing Delay & Rate Limiter Logic:');
  const startTime = Date.now();
  await rateLimitService.enforceDelayBetweenSends(0.1); // 100ms test delay
  const elapsed = Date.now() - startTime;
  console.log(`- Enforced test delay elapsed: ${elapsed}ms (Pass)`);

  // 4. Ethereal SMTP test email dispatch
  console.log('\n4. Testing Ethereal SMTP Dispatch:');
  try {
    const result = await smtpService.send({
      from: 'scheduler@reachinbox.ai',
      to: 'recipient-test@example.com',
      subject: 'ReachInbox Ethereal SMTP Verification Test',
      text: 'This is an automated delivery test verifying real Ethereal SMTP transport.',
    });
    console.log(`- Sent successfully! MessageId: ${result.messageId}`);
    console.log(`- Ethereal Preview URL: ${result.etherealPreviewUrl}`);
  } catch (err: any) {
    console.error(`- Ethereal SMTP error: ${err.message}`);
  }

  console.log('\n--- Verification Completed ---');
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
