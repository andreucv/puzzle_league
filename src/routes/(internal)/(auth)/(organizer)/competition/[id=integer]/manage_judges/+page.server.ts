import type { PageServerLoad } from "./$types";
import { prisma } from "$lib/database/create_prisma_client";
import { redirect } from "@sveltejs/kit";
import { Role } from "$lib/.prisma/generated/prisma/enums";

export const load: PageServerLoad = async (event) => {
    const competitionId = parseInt(event.params.id);

    if (isNaN(competitionId)) {
        throw redirect(302, '/competitions/explore_competitions');
    }

    const competition = await prisma.competition.findUnique({
        where: { id: competitionId },
        include: {
            categories: {
                include: {
                    judges: {
                        select: { id: true, name: true, email: true }
                    }
                },
                orderBy: { startTime: 'asc' }
            }
        }
    });

    if (!competition) {
        throw redirect(302, '/competitions/explore_competitions');
    }

    const userId = event.locals.user?.id;
    if (!userId) {
        throw redirect(302, '/login?redirect=' + encodeURIComponent(event.url.pathname));
    }

    const isCreator = competition.creatorId === userId;
    if (!isCreator) {
        const hasAccess = await prisma.roleAssignment.findFirst({
            where: {
                userId,
                OR: [
                    { role: Role.ADMIN },
                    { role: Role.ORGANIZER, competitionId }
                ]
            }
        });

        if (!hasAccess) {
            throw redirect(302, '/error/no_permission/');
        }
    }

    return {
        competition: {
            id: competition.id,
            name: competition.name
        },
        categoriesWithJudges: competition.categories.map((cat) => ({
            id: cat.id,
            description: cat.description,
            subname: cat.subname,
            type: cat.type,
            judges: cat.judges
        }))
    };
};
