import type { Competition, Category } from '$lib/.prisma/generated/prisma/client';
import { CompetitionStatus, Role } from '$lib/.prisma/generated/prisma/enums';
import { prisma } from '$lib/database/database';

/**
 * Returns whether a user can access the During Competition page for a given competition.
 * Allowed: the competition's creator, admins, and judges assigned to a category in this competition.
 */
export async function getDuringCompetitionAccess(
    competitionId: number,
    userId: string
): Promise<{ isOrganizer: boolean; isJudge: boolean; judgedCategoryIds: number[] }> {
    const [isCreator, isAdmin, judgedCategories] = await Promise.all([
        prisma.competition.findFirst({
            where: { id: competitionId, creatorId: userId },
            select: { id: true }
        }),
        prisma.roleAssignment.findFirst({
            where: { userId, role: Role.ADMIN }
        }),
        prisma.category.findMany({
            where: {
                competitionId,
                judges: { some: { id: userId } }
            },
            select: { id: true }
        })
    ]);

    return {
        isOrganizer: !!(isCreator || isAdmin),
        isJudge: judgedCategories.length > 0,
        judgedCategoryIds: judgedCategories.map((c) => c.id)
    };
}

export async function getUpcomingCompetitions(n_objects: number, offset: number) {
    return prisma.competition.findMany({
        take: n_objects,
        skip: offset,
        where: {
            status: {
                in: [CompetitionStatus.NOT_STARTED, CompetitionStatus.STARTED]
            },
        },
        include: {
            categories: true
        },
        orderBy: {
            startDate: 'asc'
        },
    });
}

export async function getPastCompetitions(n_objects: number, offset: number) {
    return prisma.competition.findMany({
        take: n_objects,
        skip: offset,
        where: {
            status: {
                in: [CompetitionStatus.FINISHED, CompetitionStatus.CANCELLED]
            },
        },
        orderBy: {
            startDate: 'desc'
        },
    });
}
