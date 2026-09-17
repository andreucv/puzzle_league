import type { CategoryType } from '$prisma/browser';

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
	autoStop: boolean;
	totalEntries: number;
	finishedEntries: number;
	competitionId: number;
	puzzles?: { pieces: number }[];
}
