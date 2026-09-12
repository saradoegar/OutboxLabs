import { redisClient } from '../config/redis.js';
import { config } from '../config/env.js';

export interface RateLimitCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  rescheduleDelayMs?: number;
  nextSlotTime?: Date;
}

export const rateLimitService = {
  /**
   * Redis-backed atomic hourly rate limit check.
   * Key pattern: email_rate_limit:<YYYY-MM-DD-HH>
   */
  async checkAndIncrement(hourlyLimitOverride?: number): Promise<RateLimitCheckResult> {
    const limit = hourlyLimitOverride && hourlyLimitOverride > 0
      ? hourlyLimitOverride
      : config.email.maxEmailsPerHour;

    const now = new Date();
    // Unique key per UTC hour: e.g. email_rate_limit:2026-09-11-19
    const hourKey = `email_rate_limit:${now.toISOString().slice(0, 13)}`;

    try {
      const count = await redisClient.incr(hourKey);

      // If first key initialization, expire after 2 hours
      if (count === 1) {
        await redisClient.expire(hourKey, 7200);
      }

      if (count > limit) {
        // Calculate milliseconds to the beginning of next hour (+ 5 second buffer)
        const nextHour = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getHours() + 1,
          0,
          5
        );
        const rescheduleDelayMs = Math.max(1000, nextHour.getTime() - now.getTime());

        return {
          allowed: false,
          currentCount: count,
          limit,
          rescheduleDelayMs,
          nextSlotTime: nextHour,
        };
      }

      return {
        allowed: true,
        currentCount: count,
        limit,
      };
    } catch (err: any) {
      console.warn('[RateLimiter] Redis rate limit check error, failing open:', err.message);
      // If Redis has temporary outage, fail open to avoid blocking pipeline
      return {
        allowed: true,
        currentCount: 0,
        limit,
      };
    }
  },

  /**
   * Delay enforcement between individual sends
   */
  async enforceDelayBetweenSends(customDelaySec?: number): Promise<void> {
    const delayMs = customDelaySec && customDelaySec > 0
      ? customDelaySec * 1000
      : config.email.delayMs;

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  },
};
