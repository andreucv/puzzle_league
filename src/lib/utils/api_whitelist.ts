/**
 * API routes that do NOT require authentication.
 * All other /api/ routes will be rejected with 401 if no session is present.
 */
const PUBLIC_API_PREFIXES = [
  '/api/auth/',                    // Better Auth's own endpoints
  '/api/competitions/bymonth/',    // Public competition calendar
] as const;

/** Returns true if the given pathname is a public API route (no auth required). */
export function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
