import { prisma } from '$lib/database/create_prisma_client';
import { InscriptionStatus } from '$lib/.prisma/generated/prisma/enums';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CategorySignup {
    categoryId: number;
    teammateIds: string[];
}

// ---------------------------------------------------------------------------
// Sign-up
// ---------------------------------------------------------------------------

export async function signUpUsersToCompetition(
    categorySignups: CategorySignup[],
    currentUserId: string
) {
    try {
        if (!categorySignups.length) {
            return { success: false, error: 'No categories selected for signup' };
        }

        const result = await prisma.$transaction(async (tx) => {
            const createdRecords = [];

            const categoryIds = categorySignups.map(signup => signup.categoryId);

            const categories = await tx.category.findMany({
                where: { id: { in: categoryIds } },
                include: {
                    competition: true,
                    records: {
                        where: {
                            users: {
                                some: { id: currentUserId }
                            }
                        }
                    }
                }
            });

            if (categories.length !== categoryIds.length) {
                const foundIds = categories.map(c => c.id);
                const missingIds = categoryIds.filter(id => !foundIds.includes(id));
                throw new Error(`Categories not found: ${missingIds.join(', ')}`);
            }

            // Block if PENDING, ACCEPTED or WAITLISTED exists
            const alreadyRegistered = categories.filter(cat =>
                cat.records.some(r =>
                    r.status === InscriptionStatus.PENDING ||
                    r.status === InscriptionStatus.ACCEPTED ||
                    r.status === InscriptionStatus.WAITLISTED
                )
            );
            if (alreadyRegistered.length > 0) {
                const categoryNames = alreadyRegistered.map(c => c.description || c.type);
                throw new Error(`Already registered for categories: ${categoryNames.join(', ')}`);
            }

            const allUserIds = new Set([currentUserId]);
            categorySignups.forEach(signup => {
                signup.teammateIds.forEach(id => allUserIds.add(id));
            });

            const existingUsers = await tx.user.findMany({
                where: { id: { in: Array.from(allUserIds) } },
                select: { id: true }
            });

            if (existingUsers.length !== allUserIds.size) {
                const foundUserIds = existingUsers.map(u => u.id);
                const missingUserIds = Array.from(allUserIds).filter(id => !foundUserIds.includes(id));
                throw new Error(`Users not found: ${missingUserIds.join(', ')}`);
            }

            for (const signup of categorySignups) {
                const category = categories.find(c => c.id === signup.categoryId)!;
                const allPartyUserIds = [currentUserId, ...signup.teammateIds];

                if (category.maxPartySize && allPartyUserIds.length > category.maxPartySize) {
                    throw new Error(`Party size (${allPartyUserIds.length}) exceeds maximum for category ${category.description || category.type} (${category.maxPartySize})`);
                }

                if (category.competition.status !== 'NOT_STARTED') {
                    throw new Error(`Registration closed for competition: ${category.competition.name}`);
                }

                // Determine initial status: WAITLISTED when category is already full
                let initialStatus = InscriptionStatus.PENDING;
                if (category.maxParties) {
                    const acceptedCount = await tx.record.count({
                        where: {
                            categoryId: signup.categoryId,
                            status: InscriptionStatus.ACCEPTED
                        }
                    });
                    if (acceptedCount >= category.maxParties) {
                        initialStatus = InscriptionStatus.WAITLISTED;
                    }
                }

                const record = await tx.record.create({
                    data: {
                        categoryId: signup.categoryId,
                        creatorId: currentUserId,
                        status: initialStatus,
                        users: {
                            connect: allPartyUserIds.map(id => ({ id }))
                        }
                    },
                    include: {
                        users: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true
                            }
                        },
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
                });

                createdRecords.push(record);
            }

            return createdRecords;
        });

        return {
            success: true,
            data: result,
            message: `Successfully registered for ${result.length} categories`
        };
    } catch (error) {
        console.error('Error signing up users to competition:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            data: null
        };
    }
}

// ---------------------------------------------------------------------------
// Query inscriptions
// ---------------------------------------------------------------------------

export async function getCategoryEntriesFromCompetition(competitionId: number, userId: string) {
    try {
        const records = await prisma.record.findMany({
            where: {
                category: {
                    competitionId
                },
                users: {
                    some: {
                        id: userId
                    }
                }
            },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                },
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
        });

        return records;
    } catch (error) {
        console.error('Error getting parties from competition:', error);
        throw error;
    }
}

export async function getInscriptionsForCompetition(competitionId: number) {
    try {
        const categories = await prisma.category.findMany({
            where: { competitionId },
            orderBy: { startTime: 'asc' },
            include: {
                records: {
                    orderBy: [
                        { status: 'asc' },
                        { createdAt: 'asc' }
                    ],
                    include: {
                        users: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true
                            }
                        }
                    }
                }
            }
        });

        return categories;
    } catch (error) {
        console.error('Error getting inscriptions for competition:', error);
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Unregister
// ---------------------------------------------------------------------------

export async function removeUserFromCategory(categoryId: number, userId: string) {
    try {
        const result = await prisma.record.deleteMany({
            where: {
                categoryId,
                status: { in: [InscriptionStatus.PENDING, InscriptionStatus.ACCEPTED, InscriptionStatus.WAITLISTED] },
                users: {
                    some: {
                        id: userId
                    }
                }
            }
        });

        return result;
    } catch (error) {
        console.error('Error removing user from category:', error);
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Accept / Refuse inscriptions (organizer actions)
// ---------------------------------------------------------------------------

export async function acceptInscription(recordId: string) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const record = await tx.record.findUnique({
                where: { id: recordId },
                include: {
                    category: {
                        include: { competition: true }
                    }
                }
            });

            if (!record) {
                throw new Error('Record not found');
            }

            if (record.status !== InscriptionStatus.PENDING && record.status !== InscriptionStatus.WAITLISTED) {
                throw new Error('Only pending or waitlisted inscriptions can be accepted');
            }

            if (record.category.maxParties) {
                const acceptedCount = await tx.record.count({
                    where: {
                        categoryId: record.categoryId,
                        status: InscriptionStatus.ACCEPTED
                    }
                });

                if (acceptedCount >= record.category.maxParties) {
                    throw new Error('Category is full — maximum number of accepted inscriptions reached');
                }
            }

            const updatedRecord = await tx.record.update({
                where: { id: recordId },
                data: { status: InscriptionStatus.ACCEPTED },
                include: {
                    users: {
                        select: { id: true, name: true, email: true, image: true }
                    }
                }
            });

            return updatedRecord;
        });

        return { success: true, data: result };
    } catch (error) {
        console.error('Error accepting inscription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function refuseInscription(recordId: string) {
    try {
        // Fetch record with users before deletion (needed for notifications)
        const record = await prisma.record.findUnique({
            where: { id: recordId },
            include: {
                users: {
                    select: { id: true, name: true, email: true, image: true }
                },
                category: {
                    select: { description: true, competitionId: true }
                }
            }
        });

        if (!record) {
            throw new Error('Record not found');
        }

        if (record.status !== InscriptionStatus.PENDING && record.status !== InscriptionStatus.WAITLISTED) {
            throw new Error('Only pending or waitlisted inscriptions can be refused');
        }

        // Delete the record from the database
        await prisma.record.delete({
            where: { id: recordId }
        });

        return { success: true, data: record };
    } catch (error) {
        console.error('Error refusing inscription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
