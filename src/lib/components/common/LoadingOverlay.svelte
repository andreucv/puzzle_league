<script lang="ts">
    import Icon from "@iconify/svelte";

    interface Props {
        /** Whether the overlay is visible */
        show?: boolean;
        /** Loading message to display */
        message?: string;
        /** Whether to use fixed positioning (full screen) or absolute (relative to parent) */
        fullScreen?: boolean;
    }

    let {
        show = false,
        message = 'Processing...',
        fullScreen = false
    }: Props = $props();
</script>

{#if show}
    <div
        class="{fullScreen ? 'fixed' : 'absolute'} inset-0 bg-surface-900/50 dark:bg-surface-50/30 flex items-center justify-center rounded-lg z-50"
        role="status"
        aria-live="polite"
    >
        <div class="bg-surface-50 dark:bg-surface-900 p-6 rounded-lg shadow-xl flex flex-col items-center gap-4">
            <Icon icon="mdi:loading" width="3rem" height="3rem" class="animate-spin text-primary-500" />
            <p class="text-lg font-medium">{message}</p>
        </div>
    </div>
{/if}
