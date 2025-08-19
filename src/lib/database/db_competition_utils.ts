import { type Competition, type Category, CompetitionStatus } from '@prisma/client';
import { prisma } from '$lib/database';

export async function getUpcomingCompetitions(n_objects: number, offset: number) {
    return prisma.competition.findMany({
        take: n_objects,
        skip: offset,
        where: {
            status: {
                in: [CompetitionStatus.UPCOMING, CompetitionStatus.ACTIVE]
            },
        },
        include: {
            categories: true
        },
        orderBy: {
            startDate: 'desc'
        },
    });
}

export async function getPastCompetitions(n_objects: number, offset: number) {
    return prisma.competition.findMany({
        take: n_objects,
        skip: offset,
        where: {
            status: {
                in: [CompetitionStatus.COMPLETED, CompetitionStatus.CANCELLED]
            },
        },
        orderBy: {
            startDate: 'desc'
        },
    });
}
