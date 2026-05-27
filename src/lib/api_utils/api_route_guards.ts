import type { RequestEvent } from '@sveltejs/kit';
import { Role } from '$lib/.prisma/generated/prisma/enums';
import {
  requireCompetitionRole,
  requireCategoryJudge,
  requireEntryJudge,
} from '$lib/api_utils/api_auth';
import { prisma } from '$lib/database/create_prisma_client';

// ---------------------------------------------------------------------------
// Guard levels
// ---------------------------------------------------------------------------

type GuardLevel =
  | 'public'
  | 'authenticated'
  | 'competitionOrganizer'
  | 'competitionJudgeOrOrganizer'
  | 'categoryOrganizer'       // category [id] but requires ORGANIZER on parent competition
  | 'categoryJudge'           // category [id] requires JUDGE or ORGANIZER
  | 'entryJudge'              // entry [id] requires JUDGE or ORGANIZER via category chain
  | 'registrationOrganizer';   // registration [id] is an entryId → lookup competition → ORGANIZER

interface RouteGuard {
  guard: GuardLevel;
  methods?: string[]; // if omitted, applies to all methods
}

// ---------------------------------------------------------------------------
// Route registry
// ---------------------------------------------------------------------------

/**
 * Each key is a route pattern. Dynamic segments are represented as:
 *   :id   — matches a single path segment (number or string)
 *   :*    — matches any remaining segments
 *
 * Routes are checked in order; more specific patterns should come first.
 */
const ROUTE_GUARDS: [RegExp, RouteGuard][] = [
  // ---- Public ----
  [/^\/api\/competitions\/bymonth\//, { guard: 'public' }],
  [/^\/api\/webhooks\//, { guard: 'public' }],  // Webhook endpoints use internal signature verification

  // ---- Authenticated only (any logged-in user) ----
  [/^\/api\/notifications\/unread-count$/, { guard: 'authenticated' }],
  [/^\/api\/notifications\/[^/]+\/read$/, { guard: 'authenticated' }],
  [/^\/api\/notifications$/, { guard: 'authenticated' }],
  [/^\/api\/users\/search$/, { guard: 'authenticated' }],
  [/^\/api\/puzzles\/search$/, { guard: 'authenticated' }],
  [/^\/api\/external-participants\/claim$/, { guard: 'authenticated' }],
  [/^\/api\/external-participants\/unclaimed$/, { guard: 'authenticated' }],
  [/^\/api\/external-participants$/, { guard: 'authenticated' }],
  [/^\/api\/events\/notifications$/, { guard: 'authenticated' }],

  // ---- Competition-scoped: ORGANIZER ----
  [/^\/api\/competitions\/[^/]+\/cancel$/, { guard: 'competitionOrganizer' }],
  [/^\/api\/competitions\/[^/]+\/toggle_registration$/, { guard: 'competitionOrganizer' }],
  [/^\/api\/competitions\/[^/]+\/copy-judges$/, { guard: 'competitionOrganizer' }],

  // ---- Competition-scoped: JUDGE or ORGANIZER ----
  [/^\/api\/competitions\/[^/]+\/entries$/, { guard: 'competitionJudgeOrOrganizer' }],
  [/^\/api\/events\/competition\/[^/]+$/, { guard: 'competitionJudgeOrOrganizer' }],

  // ---- Registration endpoints (entryId → competition → ORGANIZER) ----
  [/^\/api\/registrations\/[^/]+\/confirm$/, { guard: 'registrationOrganizer' }],
  [/^\/api\/registrations\/[^/]+\/refuse$/, { guard: 'registrationOrganizer' }],
  [/^\/api\/registrations\/[^/]+\/remind$/, { guard: 'registrationOrganizer' }],

  // ---- Category-scoped: ORGANIZER on parent competition (for judge management) ----
  [/^\/api\/categories\/[^/]+\/judges\/[^/]+$/, { guard: 'categoryOrganizer' }],
  [/^\/api\/categories\/[^/]+\/judges$/, { guard: 'categoryOrganizer' }],

  // ---- Category-scoped: JUDGE or ORGANIZER ----
  [/^\/api\/categories\/[^/]+\/entries$/, { guard: 'categoryJudge' }],
  [/^\/api\/categories\/[^/]+\/start$/, { guard: 'categoryJudge' }],

  // ---- Category-scoped: ORGANIZER only (state transitions) ----
  [/^\/api\/categories\/[^/]+\/stop$/, { guard: 'categoryOrganizer' }],
  [/^\/api\/categories\/[^/]+\/complete$/, { guard: 'categoryOrganizer' }],
  [/^\/api\/categories\/[^/]+\/resume$/, { guard: 'categoryOrganizer' }],
  [/^\/api\/categories\/[^/]+\/add-time$/, { guard: 'categoryOrganizer' }],
  [/^\/api\/categories\/[^/]+\/publish-tables$/, { guard: 'categoryOrganizer' }],
  [/^\/api\/categories\/[^/]+\/remind-pending$/, { guard: 'categoryOrganizer' }],

  // ---- Entry-scoped: JUDGE or ORGANIZER via category chain ----
  [/^\/api\/entries\/[^/]+\/pieces$/, { guard: 'entryJudge' }],
  [/^\/api\/entries\/[^/]+\/result$/, { guard: 'entryJudge' }],
];

// ---------------------------------------------------------------------------
// Route matching
// ---------------------------------------------------------------------------

function getRouteGuard(pathname: string): GuardLevel | null {
  for (const [pattern, config] of ROUTE_GUARDS) {
    if (pattern.test(pathname)) {
      return config.guard;
    }
  }
  return null;
}

/** Extract the last integer path segment from an API pathname.
 *  Works for both flat (/api/competitions/42) and nested (/api/events/competition/42) routes. */
export function extractIntId(pathname: string): number | null {
  const match = pathname.match(/\/(\d+)(?:\/|$)/);
  return match ? parseInt(match[1], 10) : null;
}

/** Extract a string ID (e.g. UUID) from /api/<resource>/<id>/... */
export function extractStringId(pathname: string): string | null {
  const match = pathname.match(/\/api\/\w+\/([^/]+)/);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Guard enforcement
// ---------------------------------------------------------------------------

/**
 * Runs the appropriate role guard based on the route registry.
 * Returns a Response (403/404) if access is denied, or null if access is granted.
 *
 * Call this AFTER authentication has already been verified (user is guaranteed non-null
 * for non-public routes).
 */
export async function enforceRouteGuard(event: RequestEvent): Promise<Response | null> {
  const pathname = event.url.pathname;
  const guard = getRouteGuard(pathname);

  // No guard found → no role requirement (just auth, handled by hook)
  if (!guard || guard === 'public' || guard === 'authenticated') {
    return null;
  }

  switch (guard) {
    case 'competitionOrganizer': {
      const id = extractIntId(pathname);
      if (id === null || isNaN(id)) {
        return jsonError('Invalid competition ID', 400);
      }
      const result = await requireCompetitionRole(event, id, [Role.ORGANIZER]);
      return result.authorized ? null : result.response;
    }

    case 'competitionJudgeOrOrganizer': {
      const id = extractIntId(pathname);
      if (id === null || isNaN(id)) {
        return jsonError('Invalid competition ID', 400);
      }
      const result = await requireCompetitionRole(event, id, [Role.ORGANIZER, Role.JUDGE]);
      return result.authorized ? null : result.response;
    }

    case 'registrationOrganizer': {
      // The [id] param is an entry ID (string/UUID), not a competition ID.
      // Look up the entry → category → competitionId.
      const entryId = extractStringId(pathname);
      if (!entryId) {
        return jsonError('Invalid entry ID', 400);
      }
      const entry = await prisma.entry.findUnique({
        where: { id: entryId },
        select: { category: { select: { competitionId: true } } },
      });
      if (!entry) {
        return jsonError('Entry not found', 404);
      }
      const result = await requireCompetitionRole(event, entry.category.competitionId, [Role.ORGANIZER]);
      return result.authorized ? null : result.response;
    }

    case 'categoryOrganizer': {
      const id = extractIntId(pathname);
      if (id === null || isNaN(id)) {
        return jsonError('Invalid category ID', 400);
      }
      const category = await prisma.category.findUnique({
        where: { id },
        select: { competitionId: true },
      });
      if (!category) {
        return jsonError('Category not found', 404);
      }
      const result = await requireCompetitionRole(event, category.competitionId, [Role.ORGANIZER]);
      return result.authorized ? null : result.response;
    }

    case 'categoryJudge': {
      const id = extractIntId(pathname);
      if (id === null || isNaN(id)) {
        return jsonError('Invalid category ID', 400);
      }
      const result = await requireCategoryJudge(event, id);
      return result.authorized ? null : result.response;
    }

    case 'entryJudge': {
      const entryId = extractStringId(pathname);
      if (!entryId) {
        return jsonError('Invalid entry ID', 400);
      }
      const result = await requireEntryJudge(event, entryId);
      return result.authorized ? null : result.response;
    }

    default:
      return null;
  }
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
