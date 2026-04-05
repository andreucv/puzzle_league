<script lang="ts">
    import ConfirmPopover from '$lib/components/common/ConfirmPopover.svelte';

    let {
        icon: Icon,
        colorClass = 'preset-filled-success-500',
        confirmTitle,
        confirmMessage,
        onConfirm,
        disabled = false,
        testId = undefined,
    }: {
        icon: any;
        colorClass?: string;
        confirmTitle: string;
        confirmMessage: string;
        onConfirm: () => void;
        disabled?: boolean;
        testId?: string;
    } = $props();

    let showPopover = $state(false);
    let isProcessing = $state(false);

    function handleButtonClick() {
        if (disabled || isProcessing) return;
        showPopover = !showPopover;
    }

    async function handleConfirm() {
        isProcessing = true;
        try {
            await onConfirm();
        } finally {
            isProcessing = false;
            showPopover = false;
        }
    }

    function handleCancel() {
        showPopover = false;
    }
</script>

<div class="relative">
    <button
        type="button"
        class="btn-icon w-4 h-4 {colorClass} rounded-full"
        disabled={disabled || isProcessing}
        onclick={handleButtonClick}
        data-testid={testId}
    >
        <Icon width="1rem" height="1rem" />
    </button>

    {#if showPopover}
        <ConfirmPopover
            title={confirmTitle}
            message={confirmMessage}
            {colorClass}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            {isProcessing}
        />
    {/if}
</div>
