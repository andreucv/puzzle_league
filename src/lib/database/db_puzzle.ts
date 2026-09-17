import type { Prisma } from '$prisma/client';
import { prisma } from '$lib/database/create_prisma_client';

export async function getPuzzles() {
    try {
        return await prisma.puzzle.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { categories: true } }
            }
        });
    } catch (error) {
        console.error('Error getting puzzles:', error);
        throw error;
    }
}

export async function getPuzzleById(id: string) {
    try {
        return await prisma.puzzle.findUnique({
            where: { id },
            include: {
                categories: {
                    select: { id: true, description: true, type: true }
                }
            }
        });
    } catch (error) {
        console.error('Error getting puzzle:', error);
        throw error;
    }
}

export async function createPuzzle(data: Prisma.PuzzleCreateInput) {
    try {
        const puzzle = await prisma.puzzle.create({ data });
        return { success: true, data: puzzle, message: 'Puzzle created successfully' };
    } catch (error) {
        console.error('Error creating puzzle:', error);
        return {
            success: false, data: null,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function updatePuzzle(id: string, data: Prisma.PuzzleUpdateInput) {
    try {
        const puzzle = await prisma.puzzle.update({ where: { id }, data });
        return { success: true, data: puzzle, message: 'Puzzle updated successfully' };
    } catch (error) {
        console.error('Error updating puzzle:', error);
        return {
            success: false, data: null,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function deletePuzzle(id: string) {
    try {
        await prisma.puzzle.delete({ where: { id } });
        return { success: true, message: 'Puzzle deleted successfully' };
    } catch (error) {
        console.error('Error deleting puzzle:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function searchPuzzles(query: string) {
    try {
        return await prisma.puzzle.findMany({
            where: {
                OR: [
                    { barcode: { contains: query, mode: 'insensitive' } },
                    { name: { contains: query, mode: 'insensitive' } },
                    { brand: { contains: query, mode: 'insensitive' } },
                ]
            },
            take: 20,
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        console.error('Error searching puzzles:', error);
        throw error;
    }
}
