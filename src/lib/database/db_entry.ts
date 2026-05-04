import { prisma } from '$lib/database/create_prisma_client';
import { CategoryStatus } from '$lib/.prisma/generated/prisma/enums';

// ---------------------------------------------------------------------------
// Entry queries — read-only functions for fetching entries (records) and
// related registration data. Split from the former db_inscription_utils.ts
// to separate query concerns from mutation/orchestration concerns.
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

// ---------------------------------------------------------------------------
// Entry mutations — state-validated writes for finish times and piece counts
// ---------------------------------------------------------------------------

export class EntryNotFoundError extends Error {
    constructor(recordId: string) {
        super(`Record ${recordId} not found`);
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
    recordId: string,
    finishTime?: string,
    tableNumber?: string
) {
    const record = await prisma.record.findUnique({
        where: { id: recordId },
        select: { category: { select: { status: true } } }
    });

    if (!record) throw new EntryNotFoundError(recordId);
    if (record.category.status !== CategoryStatus.LIVE) {
        throw new InvalidEntryStateError('Finish actions are only allowed while the category is LIVE');
    }

    return prisma.record.update({
        where: { id: recordId },
        data: {
            finishTime: finishTime ? new Date(finishTime) : new Date(),
            tableNumber: tableNumber ? parseInt(tableNumber) : undefined
        },
        include: { users: true, category: true }
    });
}

/** Undo a finish time for an entry. Only allowed while the category is LIVE. */
export async function undoFinishTime(recordId: string) {
    const record = await prisma.record.findUnique({
        where: { id: recordId },
        select: { category: { select: { status: true } } }
    });

    if (!record) throw new EntryNotFoundError(recordId);
    if (record.category.status !== CategoryStatus.LIVE) {
        throw new InvalidEntryStateError('Undo-finish actions are only allowed while the category is LIVE');
    }

    return prisma.record.update({
        where: { id: recordId },
        data: { finishTime: null },
        include: { users: true, category: true }
    });
}

/** Update the piece count for a DNF entry. Only allowed while the category is STOPPED. */
export async function updatePiecesCompleted(recordId: string, nPiecesCompleted: number) {
    const record = await prisma.record.findUnique({
        where: { id: recordId },
        select: { finishTime: true, category: { select: { status: true } } }
    });

    if (!record) throw new EntryNotFoundError(recordId);
    if (record.category.status !== CategoryStatus.STOPPED) {
        throw new InvalidEntryStateError('Pieces can only be updated while the category is STOPPED');
    }
    if (record.finishTime !== null) {
        throw new InvalidEntryStateError('Pieces can only be set on DNF records (finishTime must be null)');
    }

    return prisma.record.update({
        where: { id: recordId },
        data: { nPiecesCompleted },
        include: { users: { select: { id: true, name: true, email: true } } }
    });
}

/** Reset the piece count for a DNF entry. Only allowed while the category is STOPPED. */
export async function resetPiecesCompleted(recordId: string) {
    const record = await prisma.record.findUnique({
        where: { id: recordId },
        select: { nPiecesCompleted: true, finishTime: true, category: { select: { status: true } } }
    });

    if (!record) throw new EntryNotFoundError(recordId);
    if (record.category.status !== CategoryStatus.STOPPED) {
        throw new InvalidEntryStateError('Pieces can only be reset while the category is STOPPED');
    }
    if (record.finishTime !== null) {
        throw new InvalidEntryStateError('Cannot reset pieces on a record with a finish time');
    }

    return prisma.record.update({
        where: { id: recordId },
        data: { nPiecesCompleted: null },
        include: { users: { select: { id: true, name: true, email: true } } }
    });
}
