<script lang="ts">
    import type { PageData } from './$types';
    import { t } from '$lib/translations';
    import { enhance } from '$app/forms';
    import { Combobox, Portal, useListCollection } from '@skeletonlabs/skeleton-svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
    import { countries, getCountryFlag } from '$lib/utils/country_utils';

    let { data }: { data: PageData } = $props();

    let phonePrefixValue = $state<string[]>([]);
    let phonePrefixInputValue = $state('');
    let phoneNumberValue = $state('');
    let isSaving = $state(false);
    let phoneError = $state<string | null>(null);

    // Build phone prefix list from countries (deduplicated)
    const getPhonePrefixData = () => {
        const seen = new Set<string>();
        const prefixes: { label: string; value: string }[] = [];
        for (const c of countries) {
            if (c.phonePrefix && !seen.has(c.phonePrefix)) {
                seen.add(c.phonePrefix);
                prefixes.push({
                    label: `${getCountryFlag(c.code)} ${c.phonePrefix}`,
                    value: c.phonePrefix,
                });
            }
        }
        return prefixes;
    };

    const phonePrefixData = getPhonePrefixData();
    let filteredPrefixes = $state(phonePrefixData);

    const phonePrefixCollection = $derived(useListCollection({
        items: filteredPrefixes,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.value,
    }));
</script>

<div class="container mx-auto max-w-lg space-y-6">
    <GenericTitle text={$t('add_phone.title')} />

    <p class="text-surface-600 dark:text-surface-400">
        {$t('add_phone.description')}
    </p>

    <p class="text-sm text-surface-500 dark:text-surface-400 italic">
        {$t('add_phone.skip_hint')}
    </p>

    {#if phoneError}
        <div class="p-3 rounded-lg preset-filled-error-500 text-sm">
            {phoneError}
        </div>
    {/if}

    <Card>
        <form
            method="POST"
            action="?/savePhone"
            use:enhance={() => {
                isSaving = true;
                phoneError = null;
                return async ({ result, update }) => {
                    isSaving = false;
                    if (result.type === 'failure' && result.data?.phoneError) {
                        phoneError = result.data.phoneError as string;
                    } else {
                        await update();
                    }
                };
            }}
            class="space-y-4"
        >
            <div class="grid grid-cols-[7rem_1fr] gap-2">
                <input type="hidden" name="phonePrefix" value={phonePrefixValue[0] || ''} />
                <div class="border border-surface-300 bg-white rounded-lg overflow-hidden">
                    <Combobox
                        collection={phonePrefixCollection}
                        value={phonePrefixValue}
                        inputValue={phonePrefixInputValue}
                        onValueChange={(e) => (phonePrefixValue = e.value)}
                        onInputValueChange={(e) => {
                            phonePrefixInputValue = e.inputValue;
                            filteredPrefixes = phonePrefixData.filter((item) =>
                                item.label.toLowerCase().includes(e.inputValue.toLowerCase()) ||
                                item.value.includes(e.inputValue)
                            );
                        }}
                        onOpenChange={() => { filteredPrefixes = phonePrefixData; }}
                        placeholder={$t('add_phone.prefix_placeholder')}
                    >
                        <Combobox.Control>
                            <Combobox.Input
                                class="input text-sm px-3 py-2 bg-transparent border-none w-full"
                                data-testid="add-phone-prefix"
                            />
                            <Combobox.Trigger />
                        </Combobox.Control>
                        <Portal>
                            <Combobox.Positioner>
                                <Combobox.Content class="card bg-surface-50 p-2 shadow-xl max-h-48 overflow-y-auto rounded-lg">
                                    {#each phonePrefixCollection.items as item}
                                        <Combobox.Item {item}>
                                            <Combobox.ItemText>
                                                <div class="flex items-center gap-2 p-1">
                                                    <span>{item.label}</span>
                                                </div>
                                            </Combobox.ItemText>
                                            <Combobox.ItemIndicator>✓</Combobox.ItemIndicator>
                                        </Combobox.Item>
                                    {/each}
                                </Combobox.Content>
                            </Combobox.Positioner>
                        </Portal>
                    </Combobox>
                </div>
                <input
                    name="phoneNumber"
                    type="text"
                    class="input text-sm px-3 py-2 border rounded-lg border-surface-300 bg-white"
                    placeholder={$t('add_phone.number_placeholder')}
                    bind:value={phoneNumberValue}
                    data-testid="add-phone-number"
                />
            </div>

            <div class="flex gap-3">
                <button
                    type="submit"
                    class="btn preset-filled-primary-500 flex-1"
                    disabled={isSaving}
                    data-testid="add-phone-save"
                >
                    {isSaving ? '...' : $t('add_phone.save_button')}
                </button>
            </div>
        </form>
    </Card>

    <form method="POST" action="?/skip" use:enhance>
        <button
            type="submit"
            class="btn preset-tonal w-full"
            data-testid="add-phone-skip"
        >
            {$t('add_phone.skip_button')}
        </button>
    </form>
</div>
