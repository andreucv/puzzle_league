<script lang="ts">
    import { t } from '$lib/translations';

    interface TagCategoryDraft { tag: string; priceOverride: number | null }

    let { tags, tagCategories = $bindable() }: {
        tags: string[];
        tagCategories: TagCategoryDraft[];
    } = $props();

    function isSelected(tag: string): boolean {
        return (tagCategories ?? []).some((tc) => tc.tag === tag);
    }

    function toggle(tag: string, checked: boolean) {
        if (checked) {
            if (!isSelected(tag)) tagCategories = [...(tagCategories ?? []), { tag, priceOverride: null }];
        } else {
            tagCategories = (tagCategories ?? []).filter((tc) => tc.tag !== tag);
        }
    }

    function priceValue(tag: string): string {
        const row = (tagCategories ?? []).find((tc) => tc.tag === tag);
        return row && row.priceOverride != null ? String(row.priceOverride) : '';
    }

    function setPrice(tag: string, value: string) {
        const num = value.trim() === '' ? null : Number(value);
        tagCategories = (tagCategories ?? []).map((tc) =>
            tc.tag === tag ? { ...tc, priceOverride: num } : tc
        );
    }
</script>

<div class="space-y-2">
    <p class="text-sm font-medium">{$t('competition.create.tags_title')}</p>
    {#each tags as tag (tag)}
        <div class="flex items-center gap-2">
            <label class="flex items-center gap-2 flex-1 text-sm">
                <input
                    type="checkbox"
                    class="checkbox"
                    checked={isSelected(tag)}
                    onchange={(e) => toggle(tag, (e.target as HTMLInputElement).checked)}
                />
                {$t('participant_tags.' + tag)}
            </label>
            {#if isSelected(tag)}
                <input
                    type="number"
                    min="0"
                    step="1"
                    class="input input-sm w-28 bg-primary-50-950"
                    value={priceValue(tag)}
                    placeholder={$t('competition.create.tag_price_placeholder')}
                    oninput={(e) => setPrice(tag, (e.target as HTMLInputElement).value)}
                />
            {/if}
        </div>
    {/each}
</div>
