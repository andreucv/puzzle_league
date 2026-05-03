import { prisma } from '$lib/database/create_prisma_client';

export async function createLeague(name: string, description?: string) {
    try {
        const league = await prisma.league.create({
            data: {
                name,
                description
            }
        });

        return league;
    } catch (error) {
        console.error('Error creating league:', error);
        throw error;
    }
}

export async function getAllLeagues() {
    try {
        const leagues = await prisma.league.findMany({
            include: {
                competitions: {
                    include: {
                        categories: {
                            orderBy: { startTime: 'asc' }
                        }
                    }
                },
                _count: {
                    select: {
                        competitions: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return leagues;
    } catch (error) {
        console.error('Error getting all leagues:', error);
        throw error;
    }
}
