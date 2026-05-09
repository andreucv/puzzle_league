<script lang="ts">
    interface Tab {
        id: string;
        label: string;
        count?: number;
    }

    interface Props {
        tabs: Tab[];
        activeTab: string;
        onTabChange?: (tabId: string) => void;
    }

    let { tabs, activeTab = $bindable(), onTabChange }: Props = $props();

    function handleTabClick(tabId: string) {
        activeTab = tabId;
        onTabChange?.(tabId);
    }
</script>

<div class="flex flex-wrap gap-1 p-1 bg-surface-200/50 dark:bg-surface-800/50 rounded-lg">
        {#each tabs as tab}
            <button
                type="button"
                data-testid="filter-tab-{tab.id}"
                class="px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
                    {activeTab === tab.id
                        ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm'
                        : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100/50 dark:hover:bg-surface-700/50'}"
                onclick={() => handleTabClick(tab.id)}
            >
                {tab.label}
                {#if tab.count !== undefined}
                    <span class="ml-1 px-1.5 py-0.5 text-xs rounded-full
                        {activeTab === tab.id
                            ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                            : 'bg-surface-300/50 dark:bg-surface-600/50 text-surface-600 dark:text-surface-400'}">
                        {tab.count}
                    </span>
                {/if}
            </button>
        {/each}
    </div>
