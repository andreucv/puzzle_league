import type { Competition, Category } from '$lib/.prisma/generated/prisma/client';
import { CompetitionStatus } from '$lib/.prisma/generated/prisma/enums';
import { prisma } from '$lib/database/database';

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
