<script lang="ts">
    import { t } from '$lib/translations';
    import CheckIcon from '@iconify-svelte/mdi/check';
    import CloseIcon from '@iconify-svelte/mdi/close';
    import LoadingIcon from '@iconify-svelte/mdi/loading';

    let {
        title,
        message,
        colorClass = 'preset-filled-success-500',
        onConfirm,
        onCancel,
        isProcessing = false,
    }: {
        title: string;
        message: string;
        colorClass?: string;
        onConfirm: () => void;
        onCancel: () => void;
        isProcessing?: boolean;
    } = $props();

    let popoverElement: HTMLDivElement | undefined = $state();

    function handleClickOutside(e: MouseEvent) {
        if (popoverElement && !popoverElement.contains(e.target as Node)) {
            onCancel();
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            onCancel();
        }
    }

    $effect(() => {
        window.addEventListener('click', handleClickOutside, true);
        window.addEventListener('keydown', handleKeydown);
        return () => {
            window.removeEventListener('click', handleClickOutside, true);
            window.removeEventListener('keydown', handleKeydown);
        };
    });
</script>

<div
    bind:this={popoverElement}
    role="dialog"
    aria-modal="true"
    class="absolute bottom-full right-0 mb-2 z-50 w-64 card bg-surface-50-950 border border-surface-300-700 shadow-xl overflow-hidden"
>
    <div class="h-1 w-full {colorClass}"></div>
    <div class="p-3 space-y-2">
        <p class="text-sm font-semibold">{title}</p>
        <p class="text-xs text-surface-600 dark:text-surface-400">{message}</p>
        <div class="flex justify-end gap-2 pt-1">
            <button
                type="button"
                class="btn btn-sm preset-tonal"
                disabled={isProcessing}
                onclick={onCancel}
            >
                <CloseIcon width="1rem" height="1rem" />
                {$t('manage_inscriptions.cancel_button')}
            </button>
            <button
                type="button"
                class="btn btn-sm {colorClass}"
                disabled={isProcessing}
                onclick={onConfirm}
                data-testid="confirm-popover-action"
            >
                {#if isProcessing}
                    <LoadingIcon width="1rem" height="1rem" class="animate-spin" />
                {:else}
                    <CheckIcon width="1rem" height="1rem" />
                {/if}
                {$t('manage_inscriptions.confirm_button')}
            </button>
        </div>
    </div>
</div>
