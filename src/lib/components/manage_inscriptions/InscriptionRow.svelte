<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import Icon from '@iconify/svelte';

    let { record, showAccept = false, showRefuse = false, processing = false, onAccept, onRefuse }: {
        record: any;
        showAccept?: boolean;
        showRefuse?: boolean;
        processing?: boolean;
        onAccept?: (id: string) => void;
        onRefuse?: (id: string) => void;
    } = $props();
</script>

<div class="flex items-center gap-2 py-2 px-1 w-full border-b border-surface-200 dark:border-surface-700 last:border-b-0 {processing ? 'opacity-50' : ''}" data-testid="inscription-record-{record.id}">
    <!-- Stacked avatars -->
    <div class="flex items-center shrink-0">
        {#each record.users as user, i}
            <Avatar class="w-7 h-7 shrink-0 ring-2 ring-surface-50 dark:ring-surface-800 {i > 0 ? '-ml-4' : ''}">
                <Avatar.Image src={user.image ?? undefined} alt={user.name ?? 'User'} />
                <Avatar.Fallback class="text-[0.6rem]">{user.name?.substring(0, 2) || 'U'}</Avatar.Fallback>
            </Avatar>
        {/each}
        {#each record.userIntents || [] as intent, i}
            <div class="w-7 h-7 shrink-0 ring-2 ring-surface-50 dark:ring-surface-800 rounded-full bg-warning-200 dark:bg-warning-800 flex items-center justify-center {(record.users.length + i) > 0 ? '-ml-4' : ''}">
                <Icon icon="mdi:account-question" width="0.9rem" height="0.9rem" class="text-warning-700 dark:text-warning-300" />
            </div>
        {/each}
    </div>

    <!-- Names & creator -->
    <div class="min-w-0 flex-1">
        <div class="text-xs font-medium flex flex-wrap gap-x-1">
            {#each [...record.users.map((u: any) => u.name), ...(record.userIntents || []).map((ui: any) => ui.name)] as name, i}
                <span>{name}{i < record.users.length + (record.userIntents?.length ?? 0) - 1 ? ',' : ''}</span>
            {/each}
        </div>
        {#if record.creator}
            <span class="text-[0.65rem] text-surface-500 dark:text-surface-400 truncate block">
                <Icon icon="mdi:account-edit-outline" width="0.75rem" height="0.75rem" class="inline-block align-text-bottom" />
                {record.creator.name ?? record.creator.email}
            </span>
        {/if}
    </div>

    <!-- Actions: always same fixed width so buttons align across all rows -->
    <div class="flex items-center gap-1.5 shrink-0 ml-auto" style="width: 4.5rem; justify-content: flex-end;">
        {#if showAccept}
            <button
                type="button"
                class="btn-icon btn-icon-sm preset-filled-success-500 rounded-full"
                disabled={processing}
                onclick={() => onAccept?.(record.id)}
                data-testid="accept-inscription"
            >
                <Icon icon="mdi:check" width="1.2rem" height="1.2rem" />
            </button>
        {/if}
        {#if showRefuse}
            <button
                type="button"
                class="btn-icon btn-icon-sm preset-filled-error-500 rounded-full"
                disabled={processing}
                onclick={() => onRefuse?.(record.id)}
                data-testid="refuse-inscription"
            >
                <Icon icon="mdi:close" width="1.2rem" height="1.2rem" />
            </button>
        {/if}
    </div>
</div>
