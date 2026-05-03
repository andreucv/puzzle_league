import type { CategoryType } from '$lib/.prisma/generated/prisma/browser';

export interface CategoryData {
	id: number;
	type: CategoryType;
	description: string;
	subname?: string | null;
	status: string;
	startTime?: string;
	endTime?: string;
	realStartTime: string | null;
	realEndTime: string | null;
	extraMinutes: number;
	totalRecords: number;
	finishedRecords: number;
	competitionId: number;
	puzzles?: { pieces: number }[];
}
