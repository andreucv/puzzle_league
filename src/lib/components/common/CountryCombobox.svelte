<script lang="ts">
    import { Combobox, Portal, useListCollection } from '@skeletonlabs/skeleton-svelte';
    import { countries, getCountryFlag, getLocalizedCountryName } from '$lib/utils/country_utils';

    let {
        value = $bindable<string[]>([]),
        inputValue = $bindable(''),
        placeholder = 'Select country...',
        testId = '',
        locale = '',
    }: {
        value?: string[];
        inputValue?: string;
        placeholder?: string;
        testId?: string;
        locale?: string;
    } = $props();

    const getCountryData = () => {
        return countries.map(c => ({
            label: getLocalizedCountryName(c.code, locale || 'en'),
            value: c.code,
            emoji: getCountryFlag(c.code),
        }));
    };

    const countryData = $derived(getCountryData());
    let filteredItems = $state(getCountryData());

    const collection = $derived(useListCollection({
        items: filteredItems,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.value,
    }));
</script>

<div class="border border-surface-300 bg-white rounded-lg overflow-hidden">
    <Combobox
        {collection}
        {value}
        {inputValue}
        onValueChange={(e) => (value = e.value)}
        onInputValueChange={(e) => {
            inputValue = e.inputValue;
            filteredItems = countryData.filter((item) =>
                item.label.toLowerCase().includes(e.inputValue.toLowerCase())
            );
        }}
        onOpenChange={() => { filteredItems = countryData; }}
        {placeholder}
    >
        <Combobox.Control>
            <Combobox.Input
                class="input text-sm px-3 py-2 bg-transparent border-none w-full"
                data-testid={testId}
            />
            <Combobox.Trigger />
        </Combobox.Control>
        <Portal>
            <Combobox.Positioner>
                <Combobox.Content class="card bg-surface-50 p-2 shadow-xl max-h-48 overflow-y-auto rounded-lg">
                    {#each collection.items as item}
                        <Combobox.Item {item}>
                            <Combobox.ItemText>
                                <div class="flex items-center gap-2 p-1">
                                    <span>{item.emoji}</span>
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
