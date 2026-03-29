import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    if (env.redis.connectionString) {
      redisClient = new Redis(env.redis.connectionString, {
        password: env.redis.password || undefined,
        tls: env.isProduction ? {} : undefined,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      });
    } else {
      // Fallback for local dev without Redis
      redisClient = new Redis({
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });
    }

    redisClient.on('connect', () => logger.info('Redis client connected.'));
    redisClient.on('error', (err) => logger.error('Redis client error:', err));
    redisClient.on('reconnecting', () => logger.warn('Redis client reconnecting...'));
  }
  return redisClient;
}

export async function setCache(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  try {
    const client = getRedisClient();
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    logger.warn(`Cache set failed for key "${key}":`, err);
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch (err) {
    logger.warn(`Cache get failed for key "${key}":`, err);
    return null;
  }
}

export async function deleteCache(pattern: string): Promise<void> {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (err) {
    logger.warn(`Cache delete failed for pattern "${pattern}":`, err);
  }
}
