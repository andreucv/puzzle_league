import { prisma } from '$lib/database/create_prisma_client';
import { CategoryStatus, RegistrationStatus, NotificationType } from '$lib/.prisma/generated/prisma/enums';
import { getMaxEntriesPerCategory } from '$lib/utils/category_utils';
import { createNotification } from '$lib/notifications/notifications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CategorySignup {
    categoryId: number;
    teammateIds: string[];
    externalParticipantNames?: string[];  // new non-registered participants to create
    externalParticipantIds?: string[];    // existing unclaimed ExternalParticipants to reuse
    registeredBySelf?: boolean; // default true; set false when currentUser is not a party member
}

// ---------------------------------------------------------------------------
// Registration mutations — sign-up, unregister, confirm, refuse.
// Split from the former db_registration_utils.ts to separate orchestration
// concerns from read-only query concerns (now in db_entry.ts).
// ---------------------------------------------------------------------------

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

            // Check per-category entry limits based on category type
            for (const [catId, batchCount] of batchCountPerCategory) {
                const category = categories.find(c => c.id === catId)!;
                const maxEntries = getMaxEntriesPerCategory(category.type);
                const existingCount = await tx.entry.count({
                    where: {
                        categoryId: catId,
                        creatorId: currentUserId
                    }
                });
                if (existingCount + batchCount > maxEntries) {
                    throw new Error(`Maximum registrations reached for category ${category.description || category.type} (${maxEntries})`);
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
                const extParticipantNames = signup.externalParticipantNames || [];
                const extParticipantIds = signup.externalParticipantIds || [];
                const totalPartySize = allPartyUserIds.length + extParticipantNames.length + extParticipantIds.length;

                // Check that no user in this party is already registered in the category
                if (allPartyUserIds.length > 0) {
                    const alreadyRegistered = await tx.entry.findMany({
                        where: {
                            categoryId: signup.categoryId,
                            users: { some: { id: { in: allPartyUserIds } } }
                        },
                        include: {
                            users: { select: { id: true, name: true } }
                        }
                    });
                    if (alreadyRegistered.length > 0) {
                        const duplicateUsers = alreadyRegistered
                            .flatMap(r => r.users)
                            .filter(u => allPartyUserIds.includes(u.id));
                        const uniqueNames = [...new Set(duplicateUsers.map(u => u.name))];
                        throw new Error(`User(s) already registered in category ${category.description || category.type}: ${uniqueNames.join(', ')}`);
                    }
                }

                if (extParticipantIds.length > 0) {
                    const validExternalParticipants = await tx.externalParticipant.findMany({
                        where: { id: { in: extParticipantIds }, claimedById: null, createdById: currentUserId },
                        select: { id: true }
                    });
                    if (validExternalParticipants.length !== extParticipantIds.length) {
                        throw new Error('Some external participants were not found or are already claimed');
                    }
                }

                if (category.maxPartySize && totalPartySize > category.maxPartySize) {
                    throw new Error(`Party size (${totalPartySize}) exceeds maximum for category ${category.description || category.type} (${category.maxPartySize})`);
                }

                if (category.status !== CategoryStatus.NOT_STARTED) {
                    throw new Error(`Registration closed for category: ${category.description || category.type}`);
                }

                // Determine initial status: WAITLISTED when category is already full
                let initialStatus = RegistrationStatus.PENDING_CONFIRMATION as RegistrationStatus;
                if (category.maxParties) {
                    const confirmedCount = await tx.entry.count({
                        where: {
                            categoryId: signup.categoryId,
                            status: RegistrationStatus.CONFIRMED
                        }
                    });
                    if (confirmedCount >= category.maxParties) {
                        initialStatus = RegistrationStatus.WAITLISTED;
                    }
                }

                const record = await tx.entry.create({
                    data: {
                        categoryId: signup.categoryId,
                        creatorId: currentUserId,
                        status: initialStatus,
                        users: {
                            connect: allPartyUserIds.map(id => ({ id }))
                        },
                        externalParticipants: (extParticipantNames.length > 0 || extParticipantIds.length > 0) ? {
                            ...(extParticipantNames.length > 0 ? {
                                create: extParticipantNames.map(name => ({
                                    name,
                                    createdById: currentUserId
                                }))
                            } : {}),
                            ...(extParticipantIds.length > 0 ? {
                                connect: extParticipantIds.map(id => ({ id }))
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
                        externalParticipants: {
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

        // Notify users (other than the current user) about the registration
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
                        type: NotificationType.REGISTRATION_CREATED,
                        title: 'notifications.titles.registration_created',
                        message: 'notifications.messages.registration_created',
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
// Unregister
// ---------------------------------------------------------------------------

export async function removeUserFromCategory(categoryId: number, userId: string) {
    try {
        const result = await prisma.entry.deleteMany({
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

export async function removeEntryById(entryId: string, userId: string) {
    try {
        const entry = await prisma.entry.findUnique({
            where: { id: entryId },
            include: { users: { select: { id: true } } }
        });

        if (!entry) {
            throw new Error('Entry not found');
        }

        const isCreator = entry.creatorId === userId;
        const isParticipant = entry.users.some(u => u.id === userId);

        if (!isCreator && !isParticipant) {
            throw new Error('Not authorized to delete this entry');
        }

        if (entry.status !== RegistrationStatus.PENDING_CONFIRMATION && entry.status !== RegistrationStatus.CONFIRMED && entry.status !== RegistrationStatus.WAITLISTED) {
            throw new Error('Cannot unregister an entry that is not pending confirmation, confirmed, or waitlisted');
        }

        await prisma.entry.delete({ where: { id: entryId } });
        return { success: true };
    } catch (error) {
        console.error('Error removing entry:', error);
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Accept / Refuse registrations (organizer actions)
// ---------------------------------------------------------------------------

export async function confirmRegistration(entryId: string) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const entry = await tx.entry.findUnique({
                where: { id: entryId },
                include: {
                    category: {
                        include: { competition: true }
                    }
                }
            });

            if (!entry) {
                throw new Error('Entry not found');
            }

            if (entry.status !== RegistrationStatus.PENDING_CONFIRMATION && entry.status !== RegistrationStatus.WAITLISTED) {
                throw new Error('Only pending or waitlisted registrations can be confirmed');
            }

            if (entry.category.maxParties) {
                const confirmedCount = await tx.entry.count({
                    where: {
                        categoryId: entry.categoryId,
                        status: RegistrationStatus.CONFIRMED
                    }
                });

                if (confirmedCount >= entry.category.maxParties) {
                    throw new Error('Category is full — maximum number of confirmed registrations reached');
                }
            }

            const updatedEntry = await tx.entry.update({
                where: { id: entryId },
                data: {
                    status: RegistrationStatus.CONFIRMED,
                    confirmedAt: new Date()
                },
                include: {
                    users: {
                        select: { id: true, name: true, email: true, image: true }
                    }
                }
            });

            return updatedEntry;
        });

        return { success: true, data: result };
    } catch (error) {
        console.error('Error accepting registration:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function refuseRegistration(entryId: string) {
    try {
        // Fetch entry with users before deletion (needed for notifications)
        const entry = await prisma.entry.findUnique({
            where: { id: entryId },
            include: {
                users: {
                    select: { id: true, name: true, email: true, image: true }
                },
                category: {
                    select: { description: true, competitionId: true }
                }
            }
        });

        if (!entry) {
            throw new Error('Entry not found');
        }

        if (entry.status !== RegistrationStatus.PENDING_CONFIRMATION && entry.status !== RegistrationStatus.WAITLISTED) {
            throw new Error('Only pending confirmation or waitlisted registrations can be refused');
        }

        // Delete the entry from the database
        await prisma.entry.delete({
            where: { id: entryId }
        });

        return { success: true, data: entry };
    } catch (error) {
        console.error('Error refusing registration:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
