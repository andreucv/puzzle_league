import type { PageServerLoad } from "./$types";
import { auth } from "$lib/auth";
import { redirect } from "@sveltejs/kit";
import { prisma } from "$lib/database/create_prisma_client";

export const load: PageServerLoad = async (event) => {
    const session = await auth.api.getSession(event.request);

    if (!session?.user) {
        throw redirect(302, '/login?redirect=' + encodeURIComponent(event.url.pathname));
    }

    const userName = session.user.name;
    if (!userName) {
        return { userIntents: [] };
    }

    // Find unclaimed UserIntents with names similar to the current user
    const userNameLower = userName.toLowerCase();
    const allUnclaimed = await prisma.userIntent.findMany({
        where: {
            claimedById: null
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

    // Filter for fuzzy name matches
    const userIntents = allUnclaimed.filter(ui => {
        const intentNameLower = ui.name.toLowerCase();
        return intentNameLower.includes(userNameLower) ||
               userNameLower.includes(intentNameLower);
    });

    return { userIntents };
};
