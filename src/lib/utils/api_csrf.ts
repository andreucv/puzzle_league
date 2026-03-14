import type { RequestEvent } from '@sveltejs/kit';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Validates the Origin header on mutating requests to prevent CSRF attacks.
 * SvelteKit's built-in CSRF protection only covers form actions (+page.server.ts),
 * NOT +server.ts API endpoints. This fills that gap.
 *
 * Returns a 403 Response if the Origin doesn't match, or null if the request is valid.
 */
export function validateOrigin(event: RequestEvent): Response | null {
  if (SAFE_METHODS.has(event.request.method)) {
    return null;
  }

  const origin = event.request.headers.get('origin');
  const expectedOrigin = event.url.origin;

  // Requests without an Origin header (e.g. same-origin fetch in some browsers,
  // server-to-server calls) are allowed — the browser always sends Origin on
  // cross-origin requests that could be CSRF.
  if (!origin) {
    return null;
  }

  if (origin !== expectedOrigin) {
    return new Response(JSON.stringify({ error: 'Forbidden: origin mismatch' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null;
}
