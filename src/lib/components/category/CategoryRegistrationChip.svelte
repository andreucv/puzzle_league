<script lang="ts">
    import { getCategoryTypeName, getCategoryTypeIcon } from '$lib/utils/category_utils';
    import { getRegistrationStatusChipClass, getRegistrationStatusIcon } from '$lib/utils/registration_utils';
    import type { CategoryType } from '$lib/.prisma/generated/prisma/browser';
    import { t } from '$lib/translations';

    let { categoryType, registrationStatus = null }: { categoryType: string; registrationStatus?: string | null } = $props();

    const CategoryIcon = $derived(getCategoryTypeIcon(categoryType as CategoryType));
    const chipClass = $derived(getRegistrationStatusChipClass(registrationStatus));
    const StatusIcon = $derived(registrationStatus ? getRegistrationStatusIcon(registrationStatus) : null);
    const label = $derived($t(getCategoryTypeName(categoryType as CategoryType)));
</script>

<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs {chipClass}">
    <CategoryIcon width="0.8rem" height="0.8rem" />
    {label}
    {#if StatusIcon}
        <StatusIcon width="0.8rem" height="0.8rem" />
    {/if}
</span>
