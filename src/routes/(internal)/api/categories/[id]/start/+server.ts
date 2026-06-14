import { json, type RequestEvent } from '@sveltejs/kit';
import { startCategory, CategoryNotFoundError } from '$lib/services/category-lifecycle';
import { getAutoStopScheduler } from '$lib/services/auto-stop-singleton';
import { getPostHogClient } from '$lib/server/posthog';
import { requireCompetitionRole } from '$lib/api_utils/api_auth';
import { Role } from '$lib/.prisma/generated/prisma/enums';
import { prisma } from '$lib/database/create_prisma_client';

export const POST = async (event: RequestEvent) => {
  try {
    const categoryId = parseInt(event.params.id as string);

    if (isNaN(categoryId)) {
      return json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const body = await event.request.json().catch(() => ({}));
    const autoStop = body?.autoStop === true;
    const deadline = body?.deadline ? new Date(body.deadline) : undefined;

    let options;
    if (autoStop && deadline) {
      // Req 1: starting is judge-or-organizer, but only the ORGANIZER may arm auto-stop.
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { competitionId: true }
      });
      if (!category) {
        return json({ error: 'Category not found' }, { status: 404 });
      }
      const auth = await requireCompetitionRole(event, category.competitionId, [Role.ORGANIZER]);
      if (!auth.authorized) {
        return auth.response;
      }

      const scheduler = getAutoStopScheduler();
      if (scheduler) {
        options = { autoStop: true as const, deadline, scheduler };
      }
    }

    const category = await startCategory(categoryId, options);

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: event.locals.user?.id ?? 'server',
      event: 'category_started',
      properties: {
        category_id: categoryId,
        auto_stop: autoStop,
        deadline: deadline?.toISOString()
      }
    });

    return json({ category });
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      return json({ error: error.message }, { status: 404 });
    }
    console.error('Error starting category:', error);
    return json({ error: 'Failed to start category' }, { status: 500 });
  }
};
