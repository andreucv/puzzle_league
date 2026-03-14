import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/database/create_prisma_client';

export const GET: RequestHandler = async (event) => {
    const user = event.locals.user;
    if (!user?.name) {
        return json({ userIntents: [] });
    }

    try {
        // Find unclaimed UserIntents with a similar name (case-insensitive)
        const userIntents = await prisma.userIntent.findMany({
            where: {
                claimedById: null,
                name: {
                    contains: user.name,
                    mode: 'insensitive'
                }
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                records: {
                    include: {
                        category: {
                            include: {
                                competition: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Also search for intents where the user's name is contained in the intent name
        const reverseMatch = await prisma.userIntent.findMany({
            where: {
                claimedById: null,
                NOT: {
                    id: { in: userIntents.map(ui => ui.id) }
                }
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                records: {
                    include: {
                        category: {
                            include: {
                                competition: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Filter reverse matches using fuzzy name similarity
        const userNameLower = user.name.toLowerCase();
        const fuzzyMatches = reverseMatch.filter(ui => {
            const intentNameLower = ui.name.toLowerCase();
            return intentNameLower.includes(userNameLower) ||
                   userNameLower.includes(intentNameLower);
        });

        const allMatches = [...userIntents, ...fuzzyMatches];

        return json({ userIntents: allMatches });
    } catch (error) {
        console.error('Error fetching unclaimed user intents:', error);
        return json({ userIntents: [], error: 'Failed to fetch user intents' }, { status: 500 });
    }
};
