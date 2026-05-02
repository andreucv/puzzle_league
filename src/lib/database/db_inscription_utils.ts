import { prisma } from '$lib/database/create_prisma_client';
import { CategoryStatus, InscriptionStatus, NotificationType } from '$lib/.prisma/generated/prisma/enums';
import { getMaxRecordsPerCategory } from '$lib/utils/category_utils';
import { createNotification } from '$lib/notifications/notifications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CategorySignup {
    categoryId: number;
    teammateIds: string[];
    userIntentNames?: string[];  // new non-registered participants to create
    userIntentIds?: string[];    // existing unclaimed UserIntents to reuse
    registeredBySelf?: boolean; // default true; set false when currentUser is not a party member
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
            const uniqueCategoryIds = [...new Set(categoryIds)];

            const categories = await tx.category.findMany({
                where: { id: { in: uniqueCategoryIds } },
                include: {
                    competition: true
                }
            });

            if (categories.length !== uniqueCategoryIds.length) {
                const foundIds = categories.map(c => c.id);
                const missingIds = uniqueCategoryIds.filter(id => !foundIds.includes(id));
                throw new Error(`Categories not found: ${missingIds.join(', ')}`);
            }

            // Count how many signups in this batch target each category
            const batchCountPerCategory = new Map<number, number>();
            for (const signup of categorySignups) {
                batchCountPerCategory.set(
                    signup.categoryId,
                    (batchCountPerCategory.get(signup.categoryId) || 0) + 1
                );
            }

            // Check per-category record limits based on category type
            for (const [catId, batchCount] of batchCountPerCategory) {
                const category = categories.find(c => c.id === catId)!;
                const maxRecords = getMaxRecordsPerCategory(category.type);
                const existingCount = await tx.record.count({
                    where: {
                        categoryId: catId,
                        creatorId: currentUserId
                    }
                });
                if (existingCount + batchCount > maxRecords) {
                    throw new Error(`Maximum registrations reached for category ${category.description || category.type} (${maxRecords})`);
                }
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
                const allPartyUserIds = signup.registeredBySelf === false
                    ? [...signup.teammateIds]
                    : [currentUserId, ...signup.teammateIds];
                const intentNames = signup.userIntentNames || [];
                const intentIds = signup.userIntentIds || [];
                const totalPartySize = allPartyUserIds.length + intentNames.length + intentIds.length;

                // Check that no user in this party is already inscribed in the category
                if (allPartyUserIds.length > 0) {
                    const alreadyInscribed = await tx.record.findMany({
                        where: {
                            categoryId: signup.categoryId,
                            users: { some: { id: { in: allPartyUserIds } } }
                        },
                        include: {
                            users: { select: { id: true, name: true } }
                        }
                    });
                    if (alreadyInscribed.length > 0) {
                        const duplicateUsers = alreadyInscribed
                            .flatMap(r => r.users)
                            .filter(u => allPartyUserIds.includes(u.id));
                        const uniqueNames = [...new Set(duplicateUsers.map(u => u.name))];
                        throw new Error(`User(s) already inscribed in category ${category.description || category.type}: ${uniqueNames.join(', ')}`);
                    }
                }

                if (intentIds.length > 0) {
                    const validIntents = await tx.userIntent.findMany({
                        where: { id: { in: intentIds }, claimedById: null, createdById: currentUserId },
                        select: { id: true }
                    });
                    if (validIntents.length !== intentIds.length) {
                        throw new Error('Some user intents were not found or are already claimed');
                    }
                }

                if (category.maxPartySize && totalPartySize > category.maxPartySize) {
                    throw new Error(`Party size (${totalPartySize}) exceeds maximum for category ${category.description || category.type} (${category.maxPartySize})`);
                }

                if (category.status !== CategoryStatus.NOT_STARTED) {
                    throw new Error(`Registration closed for category: ${category.description || category.type}`);
                }

                // Determine initial status: WAITLISTED when category is already full
                let initialStatus = InscriptionStatus.PENDING_CONFIRMATION as InscriptionStatus;
                if (category.maxParties) {
                    const confirmedCount = await tx.record.count({
                        where: {
                            categoryId: signup.categoryId,
                            status: InscriptionStatus.CONFIRMED
                        }
                    });
                    if (confirmedCount >= category.maxParties) {
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
                        },
                        userIntents: (intentNames.length > 0 || intentIds.length > 0) ? {
                            ...(intentNames.length > 0 ? {
                                create: intentNames.map(name => ({
                                    name,
                                    createdById: currentUserId
                                }))
                            } : {}),
                            ...(intentIds.length > 0 ? {
                                connect: intentIds.map(id => ({ id }))
                            } : {})
                        } : undefined
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
                        userIntents: {
                            select: {
                                id: true,
                                name: true
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

        // Notify users (other than the current user) about the inscription
        for (const record of result) {
            const otherUserIds = record.users
                .map((u) => u.id)
                .filter((id) => id !== currentUserId);

            const categoryDesc = record.category.description || record.category.type;
            const competitionName = record.category.competition.name;
            const link = `/competitions/competition_details/${record.category.competition.id}`;

            await Promise.all(
                otherUserIds.map((userId) =>
                    createNotification({
                        userId,
                        type: NotificationType.INSCRIPTION_CREATED,
                        title: 'notifications.titles.inscription_created',
                        message: 'notifications.messages.inscription_created',
                        link,
                        data: {
                            categoryName: categoryDesc,
                            competitionName,
                            registeredBy: record.users.find(u => u.id === currentUserId)?.name || 'a teammate',
                        },
                    })
                )
            );
        }

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
                OR: [
                    { creatorId: userId },
                    { users: { some: { id: userId } } }
                ]
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
                userIntents: {
                    select: {
                        id: true,
                        name: true,
                        claimedById: true
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
                    select: {
                        id: true,
                        createdAt: true,
                        status: true,
                        confirmedAt: true,
                        lastRemindedAt: true,
                        tableNumber: true,
                        creatorId: true,
                        users: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true
                            }
                        },
                        userIntents: {
                            select: {
                                id: true,
                                name: true,
                                claimedById: true
                            }
                        },
                        creator: {
                            select: {
                                id: true,
                                name: true,
                                email: true
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

export async function removeRecordById(recordId: string, userId: string) {
    try {
        const record = await prisma.record.findUnique({
            where: { id: recordId },
            include: { users: { select: { id: true } } }
        });

        if (!record) {
            throw new Error('Record not found');
        }

        const isCreator = record.creatorId === userId;
        const isParticipant = record.users.some(u => u.id === userId);

        if (!isCreator && !isParticipant) {
            throw new Error('Not authorized to delete this record');
        }

        if (record.status !== InscriptionStatus.PENDING_CONFIRMATION && record.status !== InscriptionStatus.CONFIRMED && record.status !== InscriptionStatus.WAITLISTED) {
            throw new Error('Cannot unregister a record that is not pending confirmation, confirmed, or waitlisted');
        }

        await prisma.record.delete({ where: { id: recordId } });
        return { success: true };
    } catch (error) {
        console.error('Error removing record:', error);
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Accept / Refuse inscriptions (organizer actions)
// ---------------------------------------------------------------------------

export async function confirmInscription(recordId: string) {
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

            if (record.status !== InscriptionStatus.PENDING_CONFIRMATION && record.status !== InscriptionStatus.WAITLISTED) {
                throw new Error('Only pending or waitlisted inscriptions can be confirmed');
            }

            if (record.category.maxParties) {
                const confirmedCount = await tx.record.count({
                    where: {
                        categoryId: record.categoryId,
                        status: InscriptionStatus.CONFIRMED
                    }
                });

                if (confirmedCount >= record.category.maxParties) {
                    throw new Error('Category is full — maximum number of confirmed inscriptions reached');
                }
            }

            const updatedRecord = await tx.record.update({
                where: { id: recordId },
                data: {
                    status: InscriptionStatus.CONFIRMED,
                    confirmedAt: new Date()
                },
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

// ---------------------------------------------------------------------------
// Get inscribed user IDs per category for a competition
// ---------------------------------------------------------------------------

export async function getInscribedUserIdsByCategory(competitionId: number): Promise<Record<number, string[]>> {
    const records = await prisma.record.findMany({
        where: {
            category: { competitionId },
        },
        select: {
            categoryId: true,
            users: { select: { id: true } }
        }
    });

    const result: Record<number, string[]> = {};
    for (const record of records) {
        if (!result[record.categoryId]) {
            result[record.categoryId] = [];
        }
        for (const user of record.users) {
            if (!result[record.categoryId].includes(user.id)) {
                result[record.categoryId].push(user.id);
            }
        }
    }
    return result;
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

        if (record.status !== InscriptionStatus.PENDING_CONFIRMATION && record.status !== InscriptionStatus.WAITLISTED) {
            throw new Error('Only pending confirmation or waitlisted inscriptions can be refused');
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
