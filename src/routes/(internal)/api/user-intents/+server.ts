import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/database/create_prisma_client';
import { getAuthUserId } from '$lib/api_utils/api_auth';

export const GET: RequestHandler = async (event) => {
    const userId = getAuthUserId(event);

    const q = event.url.searchParams.get('q')?.trim() ?? '';
    if (q.length < 2) {
        return json({ userIntents: [] });
    }

    try {
        const userIntents = await prisma.userIntent.findMany({
            where: {
                createdById: userId,
                claimedById: null,
                name: {
                    contains: q,
                    mode: 'insensitive'
                }
            },
            select: {
                id: true,
                name: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        return json({ userIntents });
    } catch (error) {
        console.error('Error searching user intents:', error);
        return json({ userIntents: [] }, { status: 500 });
    }
};
