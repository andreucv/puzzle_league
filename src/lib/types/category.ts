import type { CategoryType } from '$lib/.prisma/generated/prisma/browser';

export interface CategoryData {
	id: number;
	type: CategoryType;
	description: string;
	subname?: string | null;
	status: string;
	startTime?: string;
	realStartTime: string | null;
	realEndTime: string | null;
	totalRecords: number;
	finishedRecords: number;
	competitionId: number;
	puzzles?: { pieces: number }[];
}
