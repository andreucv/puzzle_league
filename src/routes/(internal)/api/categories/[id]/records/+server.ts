import { type RequestEvent } from '@sveltejs/kit';

/**
 * Legacy compatibility adapter — forwards to the canonical /entries endpoint.
 * All business logic lives in /api/categories/[id]/entries.
 */
export const GET = async (event: RequestEvent) => {
  const url = new URL(event.url);
  url.pathname = url.pathname.replace(/\/records$/, '/entries');
  return fetch(url, { headers: event.request.headers });
};
