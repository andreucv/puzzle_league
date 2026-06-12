/**
 * Upstash-backed rate limiting (serverless-safe).
 *
 * Uses @upstash/ratelimit over the Upstash Redis REST API, so limits are
 * enforced globally across Vercel function instances instead of per-process.
 *
 * Enabled when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set;
 * otherwise the in-memory store in rate-limit.ts is used (local dev).
 */

import type { RequestEvent } from '@sveltejs/kit';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';

// Vercel's Upstash marketplace integration injects KV_REST_API_*;
// a direct Upstash setup uses UPSTASH_REDIS_REST_*. Accept both.
function redisCredentials() {
  return {
    url: env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN,
  };
}

export function isUpstashConfigured(): boolean {
  const { url, token } = redisCredentials();
  return Boolean(url && token);
}

let sharedRedis: Redis | null = null;

function getRedis(): Redis {
  if (!sharedRedis) {
    sharedRedis = new Redis(redisCredentials());
  }
  return sharedRedis;
}

export interface UpstashRateLimiterConfig {
  /** Window duration in milliseconds */
  windowMs: number;
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Redis key prefix, so each limiter counts independently (e.g. 'rl:api') */
  prefix: string;
  /** Extract the rate-limit key from the request */
  keyExtractor: (event: RequestEvent) => string;
}

/**
 * Creates an Upstash-backed rate limiter with the same signature as the
 * limiters from createRateLimiter: null if within limits, 429 Response if not.
 */
export function createUpstashRateLimiter(config: UpstashRateLimiterConfig) {
  const ratelimit = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowMs} ms`),
    prefix: config.prefix,
  });

  return async function rateLimit(event: RequestEvent): Promise<Response | null> {
    let success: boolean;
    let reset: number;
    try {
      ({ success, reset } = await ratelimit.limit(config.keyExtractor(event)));
    } catch (error) {
      // Fail open: an unreachable Redis must not take the API down
      console.error('Upstash rate limit check failed, allowing request:', error);
      return null;
    }

    if (success) return null;

    const retryAfterSec = Math.ceil((reset - Date.now()) / 1000);
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.max(retryAfterSec, 1)),
      },
    });
  };
}
