<script lang="ts">
    // Can import t store here. Need to use it in script to get the translated label for the status.
    import { t } from '$lib/translations';
    import { getRegistrationStatusIcon, getRegistrationStatusLabel, getRegistrationStatusIconColor, getRegistrationStatusTonalClass } from '$lib/utils/registration_utils';

    // compact: icon (+ count when > 1) only, for tight spaces like competition card rows
    let { status, waitlistPosition, compact = false, count }: { status: string; waitlistPosition?: number; compact?: boolean; count?: number } = $props();

    const StatusIcon = $derived(getRegistrationStatusIcon(status));
    const status_key = $derived(getRegistrationStatusLabel(status));
    const label = $derived(
        status === 'WAITLISTED' && waitlistPosition !== undefined
            ? $t('registration.status_waitlisted_position', { position: waitlistPosition })
            : $t(status_key)
    );
    const iconColor = $derived(getRegistrationStatusIconColor(status));
    const borderClass = $derived(getRegistrationStatusTonalClass(status));
</script>

{#if compact}
    <span class="inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums shrink-0 {iconColor}" data-testid="registration-status-badge" data-status={status} data-compact="true">
        <StatusIcon width="0.95rem" height="0.95rem" />
        {#if count !== undefined && count > 1}{count}{/if}
    </span>
{:else}
    <span class="badge flex items-center text-xs gap-1 shrink-0 {borderClass}" data-testid="registration-status-badge" data-status={status}>
        <StatusIcon width="0.8rem" height="0.8rem" class={iconColor} />
        {label}
    </span>
{/if}
