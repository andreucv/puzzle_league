import type { RequestEvent } from '@sveltejs/kit';

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
  return event.getClientAddress() + ':' + pathnameGroup(event.url.pathname);
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
// ---------------------------------------------------------------------------

const sharedStore = new InMemoryRateLimitStore();

/** General API rate limiter: 60 requests per minute */
export const apiRateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 60,
  store: sharedStore,
});

/** Stricter limiter for search endpoints: 10 requests per minute */
export const searchRateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
  store: sharedStore,
});

const SEARCH_PATHS = ['/api/users/search', '/api/puzzles/search'];

/** Returns true if this is a search endpoint that should use stricter limits. */
export function isSearchEndpoint(pathname: string): boolean {
  return SEARCH_PATHS.some((p) => pathname.startsWith(p));
}
