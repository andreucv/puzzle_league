import { RegistrationStatus } from '$prisma/enums';
import CheckCircleIcon from '@iconify-svelte/mdi/check-circle';
import ClockOutlineIcon from '@iconify-svelte/mdi/clock-outline';
import ClockAlertOutlineIcon from '@iconify-svelte/mdi/clock-alert-outline';
import HelpCircleIcon from '@iconify-svelte/mdi/help-circle';

/**
 * Single source of truth: maps a RegistrationStatus enum value to its i18n key.
 * Use with the `$t()` function to get the translated display name.
 */
const STATUS_TRANSLATION_KEYS: Record<RegistrationStatus, string> = {
	[RegistrationStatus.PENDING_CONFIRMATION]: 'registration.status_pending_confirmation',
	[RegistrationStatus.CONFIRMED]: 'registration.status_confirmed',
	[RegistrationStatus.WAITLISTED]: 'registration.status_waitlisted',
};

/**
 * A Competition's registration is open when at least one NOT_STARTED Category is open.
 * `Category.registrationOpen` is the single source of truth (#90); there is no competition flag.
 */
export function hasOpenRegistration(categories: { status: string; registrationOpen: boolean }[] | undefined | null): boolean {
	return !!categories?.some((c) => c.status === 'NOT_STARTED' && c.registrationOpen);
}

/**
 * Whether the "notify me when registration opens" bell is actionable for a viewer: follower
 * notification is available (QStash configured), the Category has not started and is closed, the
 * viewer cannot manage the Competition (organizers bypass the closed flag) and holds no Entry in it.
 */
export function canFollowCategory({
	category,
	followAvailable,
	canManage,
	hasEntry,
}: {
	category: { status: string; registrationOpen: boolean };
	followAvailable: boolean;
	canManage: boolean;
	hasEntry: boolean;
}): boolean {
	return followAvailable && category.status === 'NOT_STARTED' && !category.registrationOpen && !canManage && !hasEntry;
}

export function getRegistrationStatusLabel(status: string | undefined): string {
	const key = STATUS_TRANSLATION_KEYS[status as RegistrationStatus];
	return key;
}

export function getRegistrationStatusIcon(status: string | undefined): typeof CheckCircleIcon {
	switch (status) {
		case 'CONFIRMED': return CheckCircleIcon;
		case 'PENDING_CONFIRMATION': return ClockOutlineIcon;
		case 'WAITLISTED': return ClockAlertOutlineIcon;
		default: return HelpCircleIcon;
	}
}

export function getRegistrationStatusIconName(status: string | undefined ): string {
	switch (status) {
		case 'CONFIRMED': return 'mdi:check-circle';
		case 'PENDING_CONFIRMATION': return 'mdi:clock-outline';
		case 'WAITLISTED': return 'mdi:clock-alert-outline';
		default: return 'mdi:help-circle';
	}
}

export function getRegistrationStatusTonalClass(status: string | undefined): string {
	switch (status) {
		case 'CONFIRMED': return 'preset-tonal-success';
		case 'PENDING_CONFIRMATION': return 'preset-tonal-warning';
		case 'WAITLISTED': return 'preset-tonal-secondary';
		default: return 'preset-tonal-surface';
	}
}

export function getRegistrationStatusBorderClass(status: string): string {
	switch (status) {
		case 'CONFIRMED': return 'border-success-300 dark:border-success-700 bg-success-50/50 dark:bg-success-900/10';
		case 'PENDING_CONFIRMATION': return 'border-warning-300 dark:border-warning-700 bg-warning-50/50 dark:bg-warning-900/10';
		case 'WAITLISTED': return 'border-secondary-300 dark:border-secondary-700 bg-secondary-50/50 dark:bg-secondary-900/10';
		default: return 'border-surface-300 dark:border-surface-700';
	}
}

export function getRegistrationStatusChipClass(status: string | null): string {
	if (status === 'CONFIRMED') return 'bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-300 font-semibold';
	if (status === 'PENDING_CONFIRMATION') return 'bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-300 font-semibold';
	if (status === 'WAITLISTED') return 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/50 dark:text-secondary-300 font-semibold';
	return 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400';
}

/** Registration lifecycle order (confirmed → pending → waitlisted), used to list a user's statuses. */
export const REGISTRATION_STATUS_LIFECYCLE: RegistrationStatus[] = [
	RegistrationStatus.CONFIRMED,
	RegistrationStatus.PENDING_CONFIRMATION,
	RegistrationStatus.WAITLISTED,
];

/** Most urgent first: waitlisted > pending > confirmed. */
const REGISTRATION_STATUS_URGENCY: RegistrationStatus[] = [...REGISTRATION_STATUS_LIFECYCLE].reverse();

export type RegistrationStatusCounts = Record<RegistrationStatus, number>;

type UserEntryLike = {
	status?: string;
	creatorId?: string | null;
	users?: { id: string }[];
};

/** An Entry belongs to the user when they are one of its participants or its creator (#120). */
export function isUserEntry(entry: UserEntryLike, userId: string | null | undefined): boolean {
	if (!userId) return false;
	return entry.creatorId === userId || !!entry.users?.some((u) => u.id === userId);
}

/** Counts the user's entries per RegistrationStatus; null when the user has none. */
export function countUserEntryStatuses(
	entries: UserEntryLike[] | null | undefined,
	userId: string | null | undefined,
): RegistrationStatusCounts | null {
	const counts: RegistrationStatusCounts = {
		[RegistrationStatus.CONFIRMED]: 0,
		[RegistrationStatus.PENDING_CONFIRMATION]: 0,
		[RegistrationStatus.WAITLISTED]: 0,
	};
	let total = 0;
	for (const entry of entries ?? []) {
		if (!isUserEntry(entry, userId)) continue;
		const status = entry.status as RegistrationStatus;
		if (!(status in counts)) continue;
		counts[status]++;
		total++;
	}
	return total > 0 ? counts : null;
}

/** The most urgent status with at least one entry, or null. */
export function getMostUrgentStatus(counts: RegistrationStatusCounts | null): RegistrationStatus | null {
	if (!counts) return null;
	return REGISTRATION_STATUS_URGENCY.find((status) => counts[status] > 0) ?? null;
}

/** Statuses with at least one entry, in lifecycle order. */
export function getPresentStatuses(counts: RegistrationStatusCounts | null): RegistrationStatus[] {
	if (!counts) return [];
	return REGISTRATION_STATUS_LIFECYCLE.filter((status) => counts[status] > 0);
}

/** "1 Confirmed · 2 Pending confirmation" — the breakdown used in titles and aria-labels. */
export function formatStatusBreakdown(
	counts: RegistrationStatusCounts | null,
	translate: (key: string, params?: Record<string, unknown>) => string,
): string {
	return getPresentStatuses(counts)
		.map((status) =>
			translate('competition_card.entries_breakdown_item', {
				count: counts![status],
				status: translate(STATUS_TRANSLATION_KEYS[status]),
			}),
		)
		.join(' · ');
}

/**
 * Picks the category rows a competition card shows, keeping the input order: every category
 * holding the user's entries (up to maxUser), then other categories until maxTotal rows.
 * The rest go behind "+N more".
 */
export function selectCardCategories<T extends { entries?: UserEntryLike[] }>(
	categories: T[],
	userId: string | null | undefined,
	maxUser = 3,
	maxTotal = 2,
): { visible: T[]; hidden: T[] } {
	const hasUserEntry = (c: T) => !!c.entries?.some((e) => isUserEntry(e, userId));
	const userCategories = categories.filter(hasUserEntry).slice(0, maxUser);
	const fillCount = Math.max(0, maxTotal - userCategories.length);
	const others = categories.filter((c) => !hasUserEntry(c)).slice(0, fillCount);
	const visible = categories.filter((c) => userCategories.includes(c) || others.includes(c));
	const hidden = categories.filter((c) => !visible.includes(c));
	return { visible, hidden };
}

export function getRegistrationStatusIconColor(status: string): string {
	switch (status) {
		case 'CONFIRMED': return 'text-success-600';
		case 'PENDING_CONFIRMATION': return 'text-warning-600';
		case 'WAITLISTED': return 'text-secondary-600';
		default: return 'text-surface-600';
	}
}
