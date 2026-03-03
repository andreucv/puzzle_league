import type { CategoryType } from "@prisma/client";

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
    const typeIcons: Record<CategoryType, string> = {
        INDIVIDUAL: 'mdi:account',
        PAIRS: 'mdi:account-multiple',
        TEAM: 'mdi:account-group',
        JUNIOR_INDIVIDUAL: 'mdi:account-child',
        JUNIOR_PAIRS: 'mdi:account-child',
        PUZZLE_CHESS: 'mdi:chess-knight',
        OTHER: 'mdi:shape'
    };
    return typeIcons[type] || 'mdi:shape';
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
