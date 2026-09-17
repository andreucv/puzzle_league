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

export function getRegistrationStatusIconColor(status: string): string {
	switch (status) {
		case 'CONFIRMED': return 'text-success-600';
		case 'PENDING_CONFIRMATION': return 'text-warning-600';
		case 'WAITLISTED': return 'text-secondary-600';
		default: return 'text-surface-600';
	}
}
