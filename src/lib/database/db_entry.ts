import { prisma } from '$lib/database/create_prisma_client';
import { CategoryStatus } from '$lib/.prisma/generated/prisma/enums';

// ---------------------------------------------------------------------------
// Entry queries — read-only functions for fetching entries and
// related registration data. Split from the former db_registration_utils.ts
// to separate query concerns from mutation/orchestration concerns.
// ---------------------------------------------------------------------------

export async function getCategoryEntriesFromCompetition(competitionId: number, userId: string) {
    try {
        const entries = await prisma.entry.findMany({
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
                externalParticipants: {
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

        return entries;
    } catch (error) {
        console.error('Error getting parties from competition:', error);
        throw error;
    }
}

export async function getRegistrationsForCompetition(competitionId: number) {
    try {
        const categories = await prisma.category.findMany({
            where: { competitionId },
            orderBy: { startTime: 'asc' },
            include: {
                entries: {
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
                        externalParticipants: {
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
        console.error('Error getting registrations for competition:', error);
        throw error;
    }
}

export async function getRegisteredUserIdsByCategory(competitionId: number): Promise<Record<number, string[]>> {
    const entries = await prisma.entry.findMany({
        where: {
            category: { competitionId },
        },
        select: {
            categoryId: true,
            users: { select: { id: true } }
        }
    });

    const result: Record<number, string[]> = {};
    for (const entry of entries) {
        if (!result[entry.categoryId]) {
            result[entry.categoryId] = [];
        }
        for (const user of entry.users) {
            if (!result[entry.categoryId].includes(user.id)) {
                result[entry.categoryId].push(user.id);
            }
        }
    }
    return result;
}

// ---------------------------------------------------------------------------
// Entry mutations — state-validated writes for finish times and piece counts
// ---------------------------------------------------------------------------

export class EntryNotFoundError extends Error {
    constructor(entryId: string) {
        super(`Entry ${entryId} not found`);
        this.name = 'EntryNotFoundError';
    }
}

export class InvalidEntryStateError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidEntryStateError';
    }
}

/** Record a finish time for an entry. Only allowed while the category is LIVE. */
export async function recordFinishTime(
    entryId: string,
    finishTime?: string,
    tableNumber?: string
) {
    const entry = await prisma.entry.findUnique({
        where: { id: entryId },
        select: { category: { select: { status: true } } }
    });

    if (!entry) throw new EntryNotFoundError(entryId);
    if (entry.category.status !== CategoryStatus.LIVE) {
        throw new InvalidEntryStateError('Finish actions are only allowed while the category is LIVE');
    }

    return prisma.entry.update({
        where: { id: entryId },
        data: {
            finishTime: finishTime ? new Date(finishTime) : new Date(),
            tableNumber: tableNumber ? parseInt(tableNumber) : undefined
        },
        include: { users: true, category: true }
    });
}

/** Undo a finish time for an entry. Only allowed while the category is LIVE. */
export async function undoFinishTime(entryId: string) {
    const entry = await prisma.entry.findUnique({
        where: { id: entryId },
        select: { category: { select: { status: true } } }
    });

    if (!entry) throw new EntryNotFoundError(entryId);
    if (entry.category.status !== CategoryStatus.LIVE) {
        throw new InvalidEntryStateError('Undo-finish actions are only allowed while the category is LIVE');
    }

    return prisma.entry.update({
        where: { id: entryId },
        data: { finishTime: null },
        include: { users: true, category: true }
    });
}

/** Update the piece count for a DNF entry. Only allowed while the category is STOPPED. */
export async function updatePiecesCompleted(entryId: string, nPiecesCompleted: number) {
    const entry = await prisma.entry.findUnique({
        where: { id: entryId },
        select: { finishTime: true, category: { select: { status: true } } }
    });

    if (!entry) throw new EntryNotFoundError(entryId);
    if (entry.category.status !== CategoryStatus.STOPPED) {
        throw new InvalidEntryStateError('Pieces can only be updated while the category is STOPPED');
    }
    if (entry.finishTime !== null) {
        throw new InvalidEntryStateError('Pieces can only be set on DNF entries (finishTime must be null)');
    }

    return prisma.entry.update({
        where: { id: entryId },
        data: { nPiecesCompleted },
        include: { users: { select: { id: true, name: true, email: true } } }
    });
}

/** Reset the piece count for a DNF entry. Only allowed while the category is STOPPED. */
export async function resetPiecesCompleted(entryId: string) {
    const entry = await prisma.entry.findUnique({
        where: { id: entryId },
        select: { nPiecesCompleted: true, finishTime: true, category: { select: { status: true } } }
    });

    if (!entry) throw new EntryNotFoundError(entryId);
    if (entry.category.status !== CategoryStatus.STOPPED) {
        throw new InvalidEntryStateError('Pieces can only be reset while the category is STOPPED');
    }
    if (entry.finishTime !== null) {
        throw new InvalidEntryStateError('Cannot reset pieces on an entry with a finish time');
    }

    return prisma.entry.update({
        where: { id: entryId },
        data: { nPiecesCompleted: null },
        include: { users: { select: { id: true, name: true, email: true } } }
    });
}
