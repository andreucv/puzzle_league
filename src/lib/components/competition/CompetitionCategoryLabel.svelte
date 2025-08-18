<script lang="ts">
    import Icon from "@iconify/svelte";
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import { getCategoryTypeName } from "$lib/utils/category_utils";
    import { formatTime } from "$lib/utils/datetime_utils";

    let { category, currentUserId } = $props();

    // Helper to check if current user is in a category
    function isUserInCategory(category: any): boolean {
        if (!currentUserId || !category.records) return false;
        return category.records.some((record: any) =>
            record.users?.some((user: any) => user.id === currentUserId)
        );
    }

    // Get user's team for a category
    function getUserTeam(category: any) {
        if (!currentUserId || !category.records) return null;
        const record = category.records.find((r: any) =>
            r.users?.some((user: any) => user.id === currentUserId)
        );
        return record?.users || null;
    }

    const userTeam = getUserTeam(category);
    const isRegistered = isUserInCategory(category);
</script>

<div class="group/category relative overflow-hidden rounded-xl border transition-all duration-300
    {isRegistered
        ? 'bg-gradient-to-r from-primary-200 via-success-50/40 to-success-200 dark:from-primary-950/40 dark:via-primary-950/25 dark:to-primary-900/15 border-primary-300/50 dark:border-primary-600/30 shadow-sm shadow-primary-500/5'
        : 'bg-surface-300 dark:bg-surface-900/30 border-surface-300/50 dark:border-surface-700/30 hover:border-surface-300/70 dark:hover:border-surface-600/50 hover:shadow-sm'
    }">

    <!-- Animated background effect for registered categories -->
    {#if isRegistered}
        <div class="absolute inset-0 bg-gradient-to-r from-primary-500/3 via-transparent to-secondary-500/3 opacity-0 group-hover/category:opacity-100 transition-opacity duration-500"></div>
    {/if}

    <div class="relative flex items-center justify-between p-2.5">
        <!-- Category info with enhanced icon -->
        <div class="flex items-center gap-2.5">
            <div class="relative">
                <div class="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300
                    {isRegistered
                        ? 'bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-900 text-primary-700 dark:text-primary-300 shadow-sm'
                        : 'bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-900 text-surface-600 dark:text-surface-400 group-hover/category:shadow-sm'
                    }">
                    <Icon icon="mdi:puzzle" class="w-4 h-4" />

                    <!-- Pulse effect for registered categories -->
                    {#if isRegistered}
                        <div class="absolute inset-0 rounded-lg bg-primary-400/15 animate-pulse"></div>
                    {/if}
                </div>
            </div>

            <div class="space-y-1">
                <p class="text-sm font-bold text-surface-900 dark:text-surface-50 leading-tight">
                    {getCategoryTypeName(category.type)}

                </p>
                <p class="text-xs text-surface-700 dark:text-surface-300">
                    {category.name}
                </p>
                <div class="flex items-center gap-1.5 text-surface-600 dark:text-surface-400">
                    <Icon icon="mdi:clock-outline" class="w-3 h-3" />
                    <p class="text-xs font-medium">
                        {formatTime(category.startTime)}
                    </p>
                </div>
            </div>
        </div>

        <!-- Registration status with enhanced styling -->
        <div class="flex items-center gap-2">
            {#if userTeam}
                <!-- Team avatars with improved styling -->
                <div class="flex -space-x-1.5">
                    {#each userTeam as user, index}
                        <div class="relative group">
                            <Avatar
                                name={user.name}
                                src={user?.image ?? undefined}
                                classes="w-6 h-6 ring-2 ring-white dark:ring-surface-900 shadow-sm hover:scale-110 hover:z-10 transition-all duration-200"
                                title={user.name}
                            />
                            <!-- Subtle glow effect -->
                            <div class="absolute inset-0 rounded-full bg-primary-400/15 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10 blur-sm"></div>
                        </div>
                    {/each}
                </div>

                <!-- Enhanced registered badge -->
                <div class="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-sm shadow-primary-500/30">
                    <Icon icon="mdi:check-circle" class="w-3 h-3" />
                    <span class="text-xs font-bold">✓</span>
                </div>
            {:else}
                <!-- Available state with enhanced styling -->
                <div class="flex items-center gap-1.5 px-2 py-1 bg-surface-100/60 dark:bg-surface-800/40 text-surface-600 dark:text-surface-400 rounded-full border border-surface-200 dark:border-surface-700 backdrop-blur-sm">
                    <Icon icon="mdi:account-plus-outline" class="w-3 h-3" />
                    <span class="text-xs font-medium">Open</span>
                </div>
            {/if}
        </div>
    </div>
</div>
