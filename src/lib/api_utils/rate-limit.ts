import type { RequestEvent } from '@sveltejs/kit';
import { createUpstashRateLimiter, isUpstashConfigured } from './rate-limit-redis';

// ---------------------------------------------------------------------------
// Store interface (pluggable: in-memory, Redis, etc.)
// ---------------------------------------------------------------------------

export interface RateLimitEntry {
  count: number;
  resetAt: number; // epoch ms
}

export interface RateLimitStore {
  /** Increment the counter for a key. If the window has expired, reset it first. */
  increment(key: string, windowMs: number): Promise<RateLimitEntry>;
}

// ---------------------------------------------------------------------------
// In-memory store (good for single-instance / dev / basic Vercel protection)
// ---------------------------------------------------------------------------

export class InMemoryRateLimitStore implements RateLimitStore {
  private map = new Map<string, RateLimitEntry>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Periodic cleanup every 60 s — removes expired entries to prevent memory growth
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.map) {
        if (now > entry.resetAt) {
          this.map.delete(key);
        }
      }
    }, 60_000);

    // Allow the Node process to exit without waiting for the timer
    if (this.cleanupTimer && typeof this.cleanupTimer === 'object' && 'unref' in this.cleanupTimer) {
      this.cleanupTimer.unref();
    }
  }

  async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
    const now = Date.now();
    const existing = this.map.get(key);

    if (!existing || now > existing.resetAt) {
      const entry: RateLimitEntry = { count: 1, resetAt: now + windowMs };
      this.map.set(key, entry);
      return entry;
    }

    existing.count += 1;
    return existing;
  }
}

// ---------------------------------------------------------------------------
// Rate limiter factory
// ---------------------------------------------------------------------------

export interface RateLimiterConfig {
  /** Window duration in milliseconds */
  windowMs: number;
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Extract the rate-limit key from the request (default: IP + pathname group) */
  keyExtractor?: (event: RequestEvent) => string;
  /** Storage backend (default: InMemoryRateLimitStore) */
  store?: RateLimitStore;
}

// Strips dynamic route segments (e.g. IDs, UUIDs) from pathnames for grouping
function pathnameGroup(pathname: string): string {
  return pathname.replace(/\/\d+/g, '/*').replace(/\/[0-9a-f-]{36}/g, '/*');
}

function defaultKeyExtractor(event: RequestEvent): string {
  // Prefer the authenticated user's id so the limit follows the identity, not the
  // network address — this prevents IP rotation from bypassing the limit and avoids
  // penalising users who share a NAT/proxy. Public routes (no session) fall back to IP.
  const identity = event.locals.user?.id ?? event.getClientAddress();
  return identity + ':' + pathnameGroup(event.url.pathname);
}

/**
 * Creates a rate limiter function.
 * Returns null if the request is within limits, or a 429 Response if rate-limited.
 */
export function createRateLimiter(config: RateLimiterConfig) {
  const store = config.store ?? new InMemoryRateLimitStore();
  const keyExtractor = config.keyExtractor ?? defaultKeyExtractor;

  return async function rateLimit(event: RequestEvent): Promise<Response | null> {
    const key = keyExtractor(event);
    const entry = await store.increment(key, config.windowMs);

    if (entry.count > config.maxRequests) {
      const retryAfterSec = Math.ceil((entry.resetAt - Date.now()) / 1000);
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.max(retryAfterSec, 1)),
        },
      });
    }

    return null;
  };
}

// ---------------------------------------------------------------------------
// Pre-configured limiters for use in hooks.server.ts
//
// Upstash-backed (global, serverless-safe) when UPSTASH_REDIS_REST_* env vars
// are set; otherwise in-memory (per-instance — local dev only).
// ---------------------------------------------------------------------------

function createConfiguredLimiter(maxRequests: number, prefix: string) {
  if (isUpstashConfigured()) {
    return createUpstashRateLimiter({
      windowMs: 60_000,
      maxRequests,
      prefix,
      keyExtractor: defaultKeyExtractor,
    });
  }
  return createRateLimiter({ windowMs: 60_000, maxRequests });
}

/** General API rate limiter: 60 requests per minute */
export const apiRateLimiter = createConfiguredLimiter(60, 'rl:api');

/** Stricter limiter for search endpoints: 10 requests per minute */
export const searchRateLimiter = createConfiguredLimiter(10, 'rl:search');

const SEARCH_PATHS = ['/api/users/search', '/api/puzzles/search'];

/** Returns true if this is a search endpoint that should use stricter limits. */
export function isSearchEndpoint(pathname: string): boolean {
  return SEARCH_PATHS.some((p) => pathname.startsWith(p));
}
