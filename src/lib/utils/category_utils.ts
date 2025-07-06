import { CategoryType } from "@prisma/client";

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
