import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/database/create_prisma_client';

export const GET: RequestHandler = async (event) => {
    const user = event.locals.user;
    if (!user?.name) {
        return json({ externalParticipants: [] });
    }

    try {
        // Find unclaimed ExternalParticipants with a similar name (case-insensitive)
        const externalParticipants = await prisma.externalParticipant.findMany({
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
                entries: {
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

        // Also search for external participants where the user's name is contained in the name
        const reverseMatch = await prisma.externalParticipant.findMany({
            where: {
                claimedById: null,
                NOT: {
                    id: { in: externalParticipants.map(ui => ui.id) }
                }
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                entries: {
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

        const allMatches = [...externalParticipants, ...fuzzyMatches];

        return json({ externalParticipants: allMatches });
    } catch (error) {
        console.error('Error fetching unclaimed external participants:', error);
        return json({ externalParticipants: [], error: 'Failed to fetch external participants' }, { status: 500 });
    }
};
