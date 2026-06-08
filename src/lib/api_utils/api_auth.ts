import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/create_prisma_client';
import { Role } from '$lib/.prisma/generated/prisma/enums';
import {
  getCompetitionAccess,
  requireCategoryJudge as requireCategoryJudgeAccess,
  requireEntryJudge as requireEntryJudgeAccess,
} from '$lib/services/competition-access';

export type AuthResult =
  | { authorized: true; userId: string }
  | { authorized: false; response: Response };

/**
 * Extract the authenticated user's ID from the request.
 * When called from API routes protected by the hooks.server.ts pipeline,
 * event.locals.user is guaranteed to be non-null.
 */
export function getAuthUserId(event: RequestEvent): string {
  const user = event.locals.user;
  if (!user) {
    throw new Error('getAuthUserId called without authenticated user — is the API hook pipeline active?');
  }
  return user.id;
}

/** Check if user is authenticated (kept for use by role guard functions internally) */
export async function requireAuth(event: RequestEvent): Promise<AuthResult> {
  const user = event.locals.user;
  if (!user) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }
  return { authorized: true, userId: user.id };
}

/** Check if user has a global role (ADMIN) */
export async function requireRole(event: RequestEvent, role: Role): Promise<AuthResult> {
  const authResult = await requireAuth(event);
  if (!authResult.authorized) return authResult;

  const hasRole = await prisma.roleAssignment.findFirst({
    where: { userId: authResult.userId, role }
  });

  if (!hasRole) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }
  return authResult;
}

/** Check if user is an organizer for a specific competition (creator, admin, or scoped organizer) */
export async function requireCompetitionRole(
  event: RequestEvent,
  competitionId: number,
  roles: Role[]
): Promise<AuthResult> {
  const authResult = await requireAuth(event);
  if (!authResult.authorized) return authResult;

  const access = await getCompetitionAccess(competitionId, authResult.userId);

  // Organizer-level roles: creator, admin, or scoped competition organizer
  const wantsOrganizer = roles.includes(Role.ORGANIZER);
  const wantsJudge = roles.includes(Role.JUDGE);

  if (wantsOrganizer && access.canManageCompetition) return authResult;
  if (wantsJudge && (access.isJudge || access.canManageCompetition)) return authResult;

  return {
    authorized: false,
    response: new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  };
}

/** Check if user is judge for a category's competition */
export async function requireCategoryJudge(
  event: RequestEvent,
  categoryId: number
): Promise<AuthResult> {
  const authResult = await requireAuth(event);
  if (!authResult.authorized) return authResult;

  try {
    await requireCategoryJudgeAccess(categoryId, authResult.userId);
    return authResult;
  } catch (response) {
    if (response instanceof Response) {
      return { authorized: false, response };
    }
    throw response;
  }
}

/** Check if user is judge for an entry's category */
export async function requireEntryJudge(
  event: RequestEvent,
  entryId: string
): Promise<AuthResult> {
  const authResult = await requireAuth(event);
  if (!authResult.authorized) return authResult;

  try {
    await requireEntryJudgeAccess(entryId, authResult.userId);
    return authResult;
  } catch (response) {
    if (response instanceof Response) {
      return { authorized: false, response };
    }
    throw response;
  }
}
