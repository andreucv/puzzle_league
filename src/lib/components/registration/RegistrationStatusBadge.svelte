<script lang="ts">
    import { t } from '$lib/translations';
    import { getRegistrationStatusIcon, getRegistrationStatusLabel, getRegistrationStatusIconColor, getRegistrationStatusTonalClass } from '$lib/utils/registration_utils';

    let { status }: { status: string } = $props();

    let StatusIcon = $derived(getRegistrationStatusIcon(status));
    let label = $derived(getRegistrationStatusLabel(status, $t));
    let iconColor = $derived(getRegistrationStatusIconColor(status));
    let borderClass = $derived(getRegistrationStatusTonalClass(status));
</script>

<span class="badge flex items-center text-xs gap-1 shrink-0 {borderClass}" data-testid="registration-status-badge">
    <StatusIcon width="0.8rem" height="0.8rem" class={iconColor} />
    {label}
</span>
