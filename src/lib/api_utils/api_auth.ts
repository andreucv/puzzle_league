import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/create_prisma_client';
import { Role } from '$lib/.prisma/generated/prisma/enums';

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

/** Check if user is a judge/organizer for a specific competition */
export async function requireCompetitionRole(
  event: RequestEvent,
  competitionId: number,
  roles: Role[]
): Promise<AuthResult> {
  const authResult = await requireAuth(event);
  if (!authResult.authorized) return authResult;

  // Admins can do anything
  const isAdmin = await prisma.roleAssignment.findFirst({
    where: { userId: authResult.userId, role: Role.ADMIN }
  });
  if (isAdmin) return authResult;

  // Check competition-specific role
  const hasCompetitionRole = await prisma.roleAssignment.findFirst({
    where: {
      userId: authResult.userId,
      competitionId,
      role: { in: roles }
    }
  });

  // Also check if user is the creator
  const isCreator = await prisma.competition.findFirst({
    where: { id: competitionId, creatorId: authResult.userId }
  });

  if (!hasCompetitionRole && !isCreator) {
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

/** Check if user is judge for a category's competition */
export async function requireCategoryJudge(
  event: RequestEvent,
  categoryId: number
): Promise<AuthResult> {
  const authResult = await requireAuth(event);
  if (!authResult.authorized) return authResult;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { competitionId: true, judges: { where: { id: authResult.userId }, select: { id: true } } }
  });

  if (!category) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Category not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }

  // User is directly assigned as judge for this category
  if (category.judges.length > 0) {
    return authResult;
  }

  // Fall back to competition-level role check (organizer, admin, creator)
  return requireCompetitionRole(event, category.competitionId, [Role.JUDGE, Role.ORGANIZER]);
}

/** Check if user is judge for an entry's category */
export async function requireEntryJudge(
  event: RequestEvent,
  entryId: string
): Promise<AuthResult> {
  const authResult = await requireAuth(event);
  if (!authResult.authorized) return authResult;

  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    select: { categoryId: true }
  });

  if (!entry) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Entry not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    };
  }

  return requireCategoryJudge(event, entry.categoryId);
}
