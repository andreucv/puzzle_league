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
        inputConfig = undefined,
    }: {
        title: string;
        message: string;
        colorClass?: string;
        onConfirm: (inputValue?: string) => void;
        onCancel: () => void;
        isProcessing?: boolean;
        inputConfig?: {
            placeholder?: string;
            maxLength?: number;
        };
    } = $props();

    let inputValue = $state('');
    let popoverElement: HTMLDivElement | undefined = $state();
    let positionStyle = $state('visibility:hidden;');

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

    function handleConfirm() {
        onConfirm(inputConfig ? (inputValue.trim() || undefined) : undefined);
    }

    /**
     * Position the popover using fixed positioning so it always stays on-screen.
     * Tries above-right first, then flips vertically/horizontally as needed.
     */
    function adjustPosition(el: HTMLDivElement) {
        requestAnimationFrame(() => {
            const parent = el.parentElement;
            if (!parent) return;

            // Exclude the popover from the parent's size by measuring
            // the parent's first child (the trigger button) instead
            const trigger = parent.querySelector('button');
            const anchorRect = trigger?.getBoundingClientRect() ?? parent.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const gap = 4;

            // Vertical: prefer above, fall back to below
            let top: number;
            if (anchorRect.top - elRect.height - gap >= 0) {
                top = anchorRect.top - elRect.height - gap;
            } else {
                top = anchorRect.bottom + gap;
            }

            // Horizontal: prefer right-aligned with anchor, shift left if overflows
            let left = anchorRect.right - elRect.width;
            if (left < gap) {
                left = gap;
            }
            if (left + elRect.width > vw - gap) {
                left = vw - elRect.width - gap;
            }

            // Clamp top to viewport
            top = Math.max(gap, Math.min(top, vh - elRect.height - gap));

            positionStyle = `top:${top}px;left:${left}px;`;
        });
    }

    $effect(() => {
        window.addEventListener('click', handleClickOutside, true);
        window.addEventListener('keydown', handleKeydown);
        return () => {
            window.removeEventListener('click', handleClickOutside, true);
            window.removeEventListener('keydown', handleKeydown);
        };
    });

    $effect(() => {
        if (popoverElement) {
            adjustPosition(popoverElement);
        }
    });
</script>

<div
    bind:this={popoverElement}
    role="dialog"
    aria-modal="true"
    style={positionStyle}
    class="fixed z-50 {inputConfig ? 'w-72' : 'w-64'} card bg-surface-50-950 border border-surface-300-700 shadow-xl overflow-hidden"
>
    <div class="h-1 w-full {colorClass}"></div>
    <div class="p-3 space-y-2">
        <p class="text-sm font-semibold">{title}</p>
        <p class="text-xs text-surface-600 dark:text-surface-400">{message}</p>
        {#if inputConfig}
            <textarea
                class="textarea w-full text-xs bg-white dark:bg-surface-900"
                rows="2"
                maxlength={inputConfig.maxLength ?? 200}
                placeholder={inputConfig.placeholder ?? ''}
                bind:value={inputValue}
                disabled={isProcessing}
            ></textarea>
        {/if}
        <div class="flex justify-end gap-2 pt-1">
            <button
                type="button"
                class="btn btn-sm preset-tonal"
                disabled={isProcessing}
                onclick={onCancel}
            >
                <CloseIcon width="1rem" height="1rem" />
                {$t('manage_registrations.cancel_button')}
            </button>
            <button
                type="button"
                class="btn btn-sm {colorClass}"
                disabled={isProcessing}
                onclick={handleConfirm}
                data-testid="confirm-popover-action"
            >
                {#if isProcessing}
                    <LoadingIcon width="1rem" height="1rem" class="animate-spin" />
                {:else}
                    <CheckIcon width="1rem" height="1rem" />
                {/if}
                {$t('manage_registrations.confirm_button')}
            </button>
        </div>
    </div>
</div>
