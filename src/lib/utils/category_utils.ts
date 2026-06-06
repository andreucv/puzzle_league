import type { CategoryType } from "@prisma/client";

import AccountIcon from '@iconify-svelte/mdi/account';
import AccountMultipleIcon from '@iconify-svelte/mdi/account-multiple';
import AccountGroupIcon from '@iconify-svelte/mdi/account-group';
import AccountChildIcon from '@iconify-svelte/mdi/account-child';
import ChessKnightIcon from '@iconify-svelte/mdi/chess-knight';
import ShapeIcon from '@iconify-svelte/mdi/shape';

import TimerSandIcon from '@iconify-svelte/mdi/timer-sand';
import PlayCircleOutlineIcon from '@iconify-svelte/mdi/play-circle-outline';
import CheckCircleIcon from '@iconify-svelte/mdi/check-circle';
import CancelIcon from '@iconify-svelte/mdi/cancel';
import PauseCircleOutlineIcon from '@iconify-svelte/mdi/pause-circle-outline';

type CategoryStatusColor = 'warning' | 'success' | 'error' | 'surface';

export type CategoryStatusVisual = {
    labelKey: string;
    icon: typeof CheckCircleIcon;
    color: CategoryStatusColor;
};

/**
 * Single source of truth for how a CategoryStatus is presented (icon, color, label key).
 * Each consumer maps `color` to its own styling (badge preset vs. text color).
 */
export function getCategoryStatusVisual(status: string): CategoryStatusVisual {
    switch (status) {
        case 'LIVE':
            return { labelKey: 'category_status.in_progress', icon: PlayCircleOutlineIcon, color: 'warning' };
        case 'STOPPED':
            return { labelKey: 'category_status.stopped', icon: PauseCircleOutlineIcon, color: 'warning' };
        case 'COMPLETE':
            return { labelKey: 'category_status.completed', icon: CheckCircleIcon, color: 'success' };
        case 'CANCELED':
            return { labelKey: 'category_status.canceled', icon: CancelIcon, color: 'error' };
        default:
            return { labelKey: 'category_status.not_started', icon: TimerSandIcon, color: 'surface' };
    }
}

export function getCategoryTypeName(type: CategoryType) {
    const typeNames: Record<CategoryType, string> = {
        INDIVIDUAL: 'category_names.individual',
        PAIRS: 'category_names.pairs',
        TEAM: 'category_names.team',
        JUNIOR_INDIVIDUAL: 'category_names.junior_individual',
        JUNIOR_PAIRS: 'category_names.junior_pairs',
        PUZZLE_CHESS: 'category_names.puzzle_chess',
        OTHER: 'category_names.other'
    };
    return typeNames[type] || type;
}

export function getCategoryTypeSingularName(type: CategoryType) {
    const typeNames: Record<CategoryType, string> = {
        INDIVIDUAL: 'category_names_singular.individual',
        PAIRS: 'category_names_singular.pair',
        TEAM: 'category_names_singular.team',
        JUNIOR_INDIVIDUAL: 'category_names_singular.junior_individual',
        JUNIOR_PAIRS: 'category_names_singular.junior_pair',
        PUZZLE_CHESS: 'category_names_singular.puzzle_chess',
        OTHER: 'category_names_singular.other'
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

export function getMaxEntriesPerCategory(type: CategoryType): number {
    const maxEntries: Record<CategoryType, number> = {
        INDIVIDUAL: 4,
        PAIRS: 4,
        TEAM: 2,
        JUNIOR_INDIVIDUAL: 4,
        JUNIOR_PAIRS: 4,
        PUZZLE_CHESS: 2,
        OTHER: 1
    };
    return maxEntries[type] || 1;
}

export function calculateDuration(startTime: Date, endTime: Date) {
    if (!startTime || !endTime) return "-";
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
}

export function formatCountdown(ms: number): string {
    if (ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    if (hours > 0) return `${hours}:${mm}:${ss}`;
    return `${mm}:${ss}`;
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
