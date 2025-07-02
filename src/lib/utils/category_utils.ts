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
