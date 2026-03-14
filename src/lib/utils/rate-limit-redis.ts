/**
 * Redis-backed rate limit store (Upstash Redis — compatible with Vercel Edge & serverless).
 *
 * This is a stub. To enable:
 *
 * 1. Install the Upstash Redis client:
 *      npm install @upstash/redis
 *
 * 2. Set environment variables:
 *      UPSTASH_REDIS_REST_URL=https://<your-db>.upstash.io
 *      UPSTASH_REDIS_REST_TOKEN=<your-token>
 *
 * 3. In hooks.server.ts, swap the store:
 *      import { RedisRateLimitStore } from '$lib/utils/rate-limit-redis';
 *      const store = new RedisRateLimitStore();
 *      export const apiRateLimiter = createRateLimiter({ ..., store });
 */

import type { RateLimitStore, RateLimitEntry } from './rate-limit';

export class RedisRateLimitStore implements RateLimitStore {
  // private redis: Redis;

  constructor() {
    // TODO: Uncomment when @upstash/redis is installed
    // import { Redis } from '@upstash/redis';
    // this.redis = Redis.fromEnv();
    throw new Error(
      'RedisRateLimitStore is a stub. Install @upstash/redis and configure env vars first.'
    );
  }

  async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
    // Lua-based atomic increment + TTL for a sliding window:
    //
    // const pipeline = this.redis.pipeline();
    // pipeline.incr(key);
    // pipeline.pttl(key);
    // const [count, ttl] = await pipeline.exec<[number, number]>();
    //
    // if (ttl === -1) {
    //   await this.redis.pexpire(key, windowMs);
    // }
    //
    // const resetAt = Date.now() + (ttl > 0 ? ttl : windowMs);
    // return { count, resetAt };

    void key;
    void windowMs;
    throw new Error('RedisRateLimitStore is not implemented yet.');
  }
}
