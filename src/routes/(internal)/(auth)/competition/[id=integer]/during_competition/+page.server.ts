import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCompetition, getCompetitionCategories } from '$lib/database/database';
import { auth } from '$lib/auth';
import { prisma } from '$lib/database/create_prisma_client';
import { Role } from '$lib/.prisma/generated/prisma/enums';

export const load: PageServerLoad = async ({ params, request }) => {
    const competitionId = parseInt(params.id as string);

    if (isNaN(competitionId)) {
        throw error(400, 'Invalid competition ID');
    }

    // Auth: require login
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
        throw redirect(302, '/login');
    }
    const userId = session.user.id;

    // Check: user must be organizer/creator OR judge for this competition
    const [isCreator, roleAssignment, judgedCategories] = await Promise.all([
        prisma.competition.findFirst({
            where: { id: competitionId, creatorId: userId },
            select: { id: true }
        }),
        prisma.roleAssignment.findFirst({
            where: {
                userId,
                role: { in: [Role.ORGANIZER, Role.ADMIN] }
            }
        }),
        prisma.category.findMany({
            where: {
                competitionId,
                judges: { some: { id: userId } }
            },
            select: { id: true }
        })
    ]);

    const isOrganizer = !!(isCreator || roleAssignment);
    const isJudge = judgedCategories.length > 0;

    if (!isOrganizer && !isJudge) {
        throw error(403, 'You must be an organizer or judge for this competition');
    }

    const competition = await getCompetition(competitionId);
    const categories = await getCompetitionCategories(competitionId);

    if (!competition) {
        throw error(404, 'Competition not found');
    }

    return {
        props: {
            competition,
            categories,
            userRole: isOrganizer ? 'organizer' : 'judge',
            judgedCategoryIds: judgedCategories.map(c => c.id)
        }
    };
};
