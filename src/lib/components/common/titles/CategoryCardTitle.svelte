<script lang="ts">
    import { getCategoryTypeName, getCategoryTypeIcon } from '$lib/utils/category_utils';
    import type { CategoryType } from '$lib/.prisma/generated/prisma/browser';
    import { t } from '$lib/translations';

    let { type, subname }: { type: CategoryType, subname: string } = $props();
    const CategoryTypeIcon = $derived(getCategoryTypeIcon(type));
    const label = $derived($t(getCategoryTypeName(type)));
</script>

<div class="flex items-center gap-2">
    <CategoryTypeIcon width="1.5rem" height="1.5rem" class="text-primary-800" />
    <div class="flex items-baseline gap-2">
        <h3 class="h4 font-semibold font-sans">
            {label}
        </h3>
        {#if subname && subname !== getCategoryTypeName(type).toUpperCase()}
            <h5 class="text-sm font-normal text-surface-500">
                {subname}
            </h5>
        {/if}
    </div>
</div>
