<script lang="ts">
    import ConfirmActionButton from '$lib/components/common/buttons/ConfirmActionButton.svelte';
    import DotsVerticalIcon from '@iconify-svelte/mdi/dots-vertical';

    interface OverflowAction {
        icon: any;
        colorClass: string;
        confirmTitle: string;
        confirmMessage: string;
        onConfirm: () => void;
        testId: string;
        label: string;
    }

    let {
        actions,
        testId
    }: {
        actions: OverflowAction[];
        testId: string;
    } = $props();

    let showMenu = $state(false);

    function toggle() {
        showMenu = !showMenu;
    }

    function close() {
        showMenu = false;
    }
</script>

{#if actions.length > 0}
    <div class="relative">
        <button
            type="button"
            class="btn-icon w-4 h-4 preset-tonal rounded-full"
            onclick={toggle}
            data-testid={testId}
        >
            <DotsVerticalIcon width="1rem" height="1rem" />
        </button>
        {#if showMenu}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="fixed inset-0 z-40" onclick={close}></div>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="absolute right-0 top-full mt-1 z-50 bg-surface-50-950 border border-surface-300-700 rounded-lg shadow-lg min-w-40">
                <div class="p-1 space-y-1">
                    {#each actions as action (action.testId)}
                        <ConfirmActionButton
                            icon={action.icon}
                            colorClass={action.colorClass}
                            confirmTitle={action.confirmTitle}
                            confirmMessage={action.confirmMessage}
                            onConfirm={() => { action.onConfirm(); close(); }}
                            testId={action.testId}
                            label={action.label}
                        />
                    {/each}
                </div>
            </div>
        {/if}
    </div>
{/if}
