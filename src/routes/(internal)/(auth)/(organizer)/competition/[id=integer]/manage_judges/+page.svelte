<script lang="ts">
    import Icon from '@iconify/svelte';
    import { invalidateAll } from '$app/navigation';
    import { t } from '$lib/translations';
    import CompetitionTitle from '$lib/components/common/titles/CompetitionName.svelte';
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';
    import CategoryCardTitle from '$lib/components/common/titles/CategoryCardTitle.svelte';
    import { Avatar } from '@skeletonlabs/skeleton-svelte';

    import CloseIcon from '@iconify-svelte/mdi/close';
    import AccountPlusIcon from '@iconify-svelte/mdi/account-plus';
    import MagnifyIcon from '@iconify-svelte/mdi/magnify';
    import ContentCopyIcon from '@iconify-svelte/mdi/content-copy';

    interface JudgeUser {
        id: string;
        name: string;
        email: string;
    }

    let { data } = $props();

    let competition = $derived(data.competition);
    let categoriesWithJudges = $derived(data.categoriesWithJudges);

    // Per-category search state
    let searchQueries: Record<number, string> = $state({});
    let searchResults: Record<number, JudgeUser[]> = $state({});
    let searchingCategory: number | null = $state(null);
    let searchTimeouts: Record<number, ReturnType<typeof setTimeout>> = {};

    // Result message
    let resultMessage = $state<{ success: boolean; message: string } | null>(null);
    let messageDismissTimer: ReturnType<typeof setTimeout> | null = null;
    let messageProgressKey = $state(0);

    function showResultMessage(msg: { success: boolean; message: string }) {
        if (messageDismissTimer) clearTimeout(messageDismissTimer);
        resultMessage = msg;
        messageProgressKey++;
        messageDismissTimer = setTimeout(() => {
            resultMessage = null;
            messageDismissTimer = null;
        }, 5000);
    }

    function handleSearchInput(categoryId: number) {
        if (searchTimeouts[categoryId]) clearTimeout(searchTimeouts[categoryId]);
        const query = searchQueries[categoryId] ?? '';

        if (query.length < 2) {
            searchResults[categoryId] = [];
            return;
        }

        searchingCategory = categoryId;
        searchTimeouts[categoryId] = setTimeout(async () => {
            try {
                const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
                if (response.ok) {
                    const data = await response.json();
                    searchResults[categoryId] = data.users;
                }
            } catch {
                searchResults[categoryId] = [];
            }
            searchingCategory = null;
        }, 300);
    }

    function getFilteredResults(categoryId: number): JudgeUser[] {
        const results = searchResults[categoryId] ?? [];
        const currentJudges = categoriesWithJudges.find((c) => c.id === categoryId)?.judges ?? [];
        const judgeIds = new Set(currentJudges.map((j) => j.id));
        return results.filter((u) => !judgeIds.has(u.id));
    }

    async function addJudge(categoryId: number, user: JudgeUser) {
        try {
            const response = await fetch(`/api/categories/${categoryId}/judges`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });

            if (response.ok) {
                searchQueries[categoryId] = '';
                searchResults[categoryId] = [];
                showResultMessage({ success: true, message: $t('manage_judges.judge_added') });
                await invalidateAll();
            } else {
                const err = await response.json();
                showResultMessage({ success: false, message: err.error || $t('manage_judges.error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_judges.error') });
        }
    }

    async function removeJudge(categoryId: number, userId: string) {
        try {
            const response = await fetch(`/api/categories/${categoryId}/judges/${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showResultMessage({ success: true, message: $t('manage_judges.judge_removed') });
                await invalidateAll();
            } else {
                const err = await response.json();
                showResultMessage({ success: false, message: err.error || $t('manage_judges.error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_judges.error') });
        }
    }

    async function copyJudgesToAll(sourceCategoryId: number) {
        try {
            const response = await fetch(`/api/competitions/${competition.id}/copy-judges`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceCategoryId })
            });

            if (response.ok) {
                showResultMessage({ success: true, message: $t('manage_judges.judges_copied') });
                await invalidateAll();
            } else {
                const err = await response.json();
                showResultMessage({ success: false, message: err.error || $t('manage_judges.error') });
            }
        } catch {
            showResultMessage({ success: false, message: $t('manage_judges.error') });
        }
    }
</script>

<div class="container mx-auto max-w-4xl space-y-4">
    <!-- Header -->
    <div class="space-y-4">
        <TitleBackButton href="/competitions/competition_details/{competition?.id}" text={$t('manage_judges.title')} subtitle={competition.name}/>
    </div>

    <!-- Result message -->
    {#if resultMessage}
        <div class="rounded-lg overflow-hidden {resultMessage.success ? 'preset-filled-success-500' : 'preset-filled-error-500'}">
            <div class="p-4 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <Icon icon={resultMessage.success ? 'mdi:check-circle' : 'mdi:alert-circle'} width="1.2rem" height="1.2rem" />
                    <span>{resultMessage.message}</span>
                </div>
                <button type="button" class="opacity-70 hover:opacity-100" onclick={() => { resultMessage = null; if (messageDismissTimer) { clearTimeout(messageDismissTimer); messageDismissTimer = null; } }}>
                    <Icon icon="mdi:close" width="1rem" height="1rem" />
                </button>
            </div>
            {#key messageProgressKey}
                <div class="h-1 w-full {resultMessage.success ? 'bg-success-900/30' : 'bg-error-900/30'}">
                    <div class="h-full {resultMessage.success ? 'bg-success-200' : 'bg-error-200'} animate-shrink"></div>
                </div>
            {/key}
        </div>
    {/if}

    <!-- Categories with judges -->
    <div class="space-y-6">
        {#each categoriesWithJudges as category (category.id)}
            <div class="card preset-outlined-surface-200-800 p-4 space-y-2 min-w-0">
                <div class="mb-4">
                    <CategoryCardTitle type={category.type} subname={category.subname ?? ''} />
                </div>

                <!-- Search to add judge (above list) -->
                <div class="relative mb-4">
                    <div class="flex items-center gap-2 border border-surface-300 dark:border-surface-600 rounded-lg px-3 py-2">
                        <MagnifyIcon width="1.2rem" height="1.2rem" class="text-surface-500 shrink-0" />
                        <input
                            type="text"
                            class="w-full bg-transparent border-none outline-none text-sm"
                            placeholder={$t('manage_judges.search_placeholder')}
                            bind:value={searchQueries[category.id]}
                            oninput={() => handleSearchInput(category.id)}
                            data-testid="judge-search-{category.id}"
                        />
                        {#if searchingCategory === category.id}
                            <Icon icon="mdi:loading" class="animate-spin text-surface-400" width="1.2rem" height="1.2rem" />
                        {/if}
                    </div>

                    <!-- Search results dropdown (absolutely positioned below input) -->
                    {#if (searchQueries[category.id] ?? '').length >= 2}
                        {@const filtered = getFilteredResults(category.id)}
                        {#if filtered.length > 0}
                            <div class="absolute z-50 mt-1 w-full bg-surface-50 dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {#each filtered as user (user.id)}
                                    <button
                                        type="button"
                                        class="w-full flex items-center justify-between p-3 hover:bg-surface-200 dark:hover:bg-surface-700 text-left"
                                        onclick={() => addJudge(category.id, user)}
                                        data-testid="judge-search-result-{user.id}"
                                    >
                                        <div class="flex items-center gap-2 min-w-0">
                                            <Avatar class="w-7 h-7 shrink-0">
                                                <Avatar.Fallback>{user.name?.substring(0, 2) ?? 'U'}</Avatar.Fallback>
                                            </Avatar>
                                            <div class="min-w-0">
                                                <span class="text-sm font-medium block truncate">{user.name}</span>
                                                <span class="text-xs text-surface-500 block truncate">{user.email}</span>
                                            </div>
                                        </div>
                                        <AccountPlusIcon width="1.2rem" height="1.2rem" class="text-primary-500 shrink-0" />
                                    </button>
                                {/each}
                            </div>
                        {:else if searchingCategory !== category.id}
                            <div class="absolute z-50 mt-1 w-full bg-surface-50 dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg shadow-lg p-3">
                                <p class="text-sm text-surface-500 text-center">{$t('manage_judges.no_results')}</p>
                            </div>
                        {/if}
                    {/if}
                </div>

                <!-- Current judges list -->
                {#if category.judges.length > 0}
                    <div class="space-y-2">
                        {#each category.judges as judge (judge.id)}
                            <div class="flex items-center justify-between p-2 rounded-lg bg-surface-100 dark:bg-surface-800" data-testid="judge-entry-{category.id}-{judge.id}">
                                <div class="flex items-center gap-2 min-w-0">
                                    <Avatar class="w-7 h-7 shrink-0">
                                        <Avatar.Fallback>{judge.name?.substring(0, 2) ?? 'U'}</Avatar.Fallback>
                                    </Avatar>
                                    <div class="min-w-0">
                                        <span class="text-sm font-medium block truncate">{judge.name}</span>
                                        <span class="text-xs text-surface-500 block truncate">{judge.email}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    class="btn btn-sm preset-filled-error-500 shrink-0"
                                    onclick={() => removeJudge(category.id, judge.id)}
                                    aria-label="{$t('manage_judges.remove_judge')} {judge.name}"
                                    data-testid="remove-judge-{category.id}-{judge.id}"
                                >
                                    <CloseIcon width="1rem" height="1rem" />
                                </button>
                            </div>
                        {/each}
                    </div>

                    <!-- Copy judges to all categories -->
                    {#if categoriesWithJudges.length > 1}
                        <div class="mt-3 flex justify-end">
                            <button
                                type="button"
                                class="btn btn-sm preset-tonal-primary"
                                onclick={() => copyJudgesToAll(category.id)}
                                data-testid="copy-judges-{category.id}"
                            >
                                <ContentCopyIcon width="1rem" height="1rem" />
                                {$t('manage_judges.copy_to_all')}
                            </button>
                        </div>
                    {/if}
                {:else}
                    <p class="text-sm text-surface-500">{$t('manage_judges.no_judges')}</p>
                {/if}
            </div>
        {/each}
    </div>

    {#if categoriesWithJudges.length === 0}
        <div class="card p-8 text-center">
            <Icon icon="mdi:inbox-outline" class="text-6xl text-surface-400 mx-auto mb-4" />
            <h3 class="text-xl font-semibold mb-2">{$t('manage_judges.no_categories')}</h3>
        </div>
    {/if}
</div>

<style>
    @keyframes shrink {
        from { width: 100%; }
        to { width: 0%; }
    }
    .animate-shrink {
        animation: shrink 5s linear forwards;
    }
</style>
