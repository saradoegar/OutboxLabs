import { Redis, RedisOptions } from 'ioredis';
import { config } from './env.js';

const parseRedisUrl = (urlStr: string): RedisOptions => {
  try {
    const parsed = new URL(urlStr);
    return {
      host: parsed.hostname || '127.0.0.1',
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      },
    };
  } catch {
    return {
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      },
    };
  }
};

export const redisConnectionOptions: RedisOptions = parseRedisUrl(config.redis.url);

export const createRedisClient = (): Redis => {
  return new Redis(config.redis.url, redisConnectionOptions);
};

// Shared Redis client for generic cache / rate limiting
export const redisClient = createRedisClient();

redisClient.on('error', (err) => {
  // Graceful logging without crashing on unhandled error events
  console.warn('[Redis] Connection warning:', err.message);
});

redisClient.on('connect', () => {
  console.log('[Redis] Connected successfully');
});
