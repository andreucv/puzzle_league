<script lang="ts">
    import Icon from '@iconify/svelte';

    interface Preset {
        id: string;
        label: string;
        icon: string;
        disabled?: boolean;
    }

    interface Props {
        presets: Preset[];
        activePresets: string[];
        onToggle?: (presetId: string) => void;
    }

    let { presets, activePresets = $bindable([]), onToggle }: Props = $props();

    function handleToggle(presetId: string) {
        const index = activePresets.indexOf(presetId);
        if (index === -1) {
            activePresets = [...activePresets, presetId];
        } else {
            activePresets = activePresets.filter(id => id !== presetId);
        }
        onToggle?.(presetId);
    }
</script>

<div class="flex flex-wrap gap-2">
    {#each presets as preset}
        <button
            type="button"
            data-testid="preset-chip-{preset.id}"
            disabled={preset.disabled}
            class="flex items-center gap-1 px-2.5 py-1 text-sm font-medium rounded-full border transition-all duration-200
                {preset.disabled
                    ? 'opacity-50 cursor-not-allowed border-surface-300 dark:border-surface-600 text-surface-400 dark:text-surface-500'
                    : activePresets.includes(preset.id)
                        ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                        : 'bg-white dark:bg-surface-800 border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400'}"
            onclick={() => !preset.disabled && handleToggle(preset.id)}
        >
            <Icon icon={preset.icon} class="w-3.5 h-3.5" />
            {preset.label}
        </button>
    {/each}
</div>
