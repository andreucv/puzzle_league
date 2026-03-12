import type { CategoryType } from "@prisma/client";

import AccountIcon from '@iconify-svelte/mdi/account';
import AccountMultipleIcon from '@iconify-svelte/mdi/account-multiple';
import AccountGroupIcon from '@iconify-svelte/mdi/account-group';
import AccountChildIcon from '@iconify-svelte/mdi/account-child';
import ChessKnightIcon from '@iconify-svelte/mdi/chess-knight';
import ShapeIcon from '@iconify-svelte/mdi/shape';

export function getCategoryTypeName(type: CategoryType) {
    const typeNames: Record<CategoryType, string> = {
        INDIVIDUAL: 'Individual',
        PAIRS: 'Pairs',
        TEAM: 'Team',
        JUNIOR_INDIVIDUAL: 'Junior Individual',
        JUNIOR_PAIRS: 'Junior Pairs',
        PUZZLE_CHESS: 'Puzzle Chess',
        OTHER: 'Other'
    };
    return typeNames[type] || type;
}

export function getCategoryTypeIcon(type: CategoryType) {
    const typeIcons: Record<CategoryType, typeof AccountIcon> = {
        INDIVIDUAL: AccountIcon,
        PAIRS: AccountMultipleIcon,
        TEAM: AccountGroupIcon,
        JUNIOR_INDIVIDUAL: AccountChildIcon,
        JUNIOR_PAIRS: AccountChildIcon,
        PUZZLE_CHESS: ChessKnightIcon,
        OTHER: ShapeIcon
    };
    return typeIcons[type] || ShapeIcon;
}

export function getPartySizeByCategoryType(type: CategoryType) {
    const partySizes: Record<CategoryType, number> = {
        INDIVIDUAL: 1,
        PAIRS: 2,
        TEAM: 4,
        JUNIOR_INDIVIDUAL: 1,
        JUNIOR_PAIRS: 2,
        PUZZLE_CHESS: 4,
        OTHER: 8
    };
    return partySizes[type] || 1;
}

export function getMaxRecordsPerCategory(type: CategoryType): number {
    const maxRecords: Record<CategoryType, number> = {
        INDIVIDUAL: 4,
        PAIRS: 2,
        TEAM: 1,
        JUNIOR_INDIVIDUAL: 4,
        JUNIOR_PAIRS: 2,
        PUZZLE_CHESS: 1,
        OTHER: 1
    };
    return maxRecords[type] || 1;
}

export function calculateDuration(startTime: Date, endTime: Date) {
    if (!startTime || !endTime) return "-";
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
}

export function formatElapsedTime(startTime: Date, finishTime: Date): string {
    const ms = new Date(finishTime).getTime() - new Date(startTime).getTime();
    if (ms < 0) return '-';
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
}

export function formatTimeDelta(firstFinish: Date, otherFinish: Date): string {
    const ms = new Date(otherFinish).getTime() - new Date(firstFinish).getTime();
    if (ms <= 0) return '+0s';
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (hours > 0) return `+${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `+${minutes}m ${seconds}s`;
    return `+${seconds}s`;
}
