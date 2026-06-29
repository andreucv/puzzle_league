<script lang="ts">
    import { Combobox, Portal, useListCollection } from '@skeletonlabs/skeleton-svelte';
    import { countries, getCountryFlag } from '$lib/utils/country_utils';

    let {
        value = $bindable<string[]>([]),
        inputValue = $bindable(''),
        placeholder = 'e.g. +34',
        testId = '',
    }: {
        value?: string[];
        inputValue?: string;
        placeholder?: string;
        testId?: string;
    } = $props();

    // Most probable country from the browser locale's region (e.g. "ca" → ES, "en-US" → US).
    const probableCountry = (() => {
        if (typeof navigator === 'undefined') return '';
        try {
            return new Intl.Locale(navigator.language).maximize().region ?? '';
        } catch {
            return '';
        }
    })();

    const getPhonePrefixData = () => {
        const seen = new Set<string>();
        const prefixes: { label: string; value: string }[] = [];
        // Pin the probable country's prefix first, with its own flag — shared prefixes (e.g. +1)
        // would otherwise dedupe to the first matching country in the static list.
        const probable = countries.find((c) => c.code === probableCountry && c.phonePrefix);
        if (probable?.phonePrefix) {
            seen.add(probable.phonePrefix);
            prefixes.push({
                label: `${getCountryFlag(probable.code)} ${probable.phonePrefix}`,
                value: probable.phonePrefix,
            });
        }
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
    // What the user actually typed. zag clears the bound inputValue on blur (reason
    // "interact-outside") before onOpenChange fires, so we can't read it there — track it here.
    let typedValue = $state('');

    const collection = $derived(useListCollection({
        items: filteredPrefixes,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.value,
    }));

    // Skeleton's combobox only commits a selection via the dropdown; on blur it resets the
    // input to the committed value. So a user who types "+34" but doesn't click the option
    // loses it. When the field closes without a selection, commit a matching typed prefix.
    function commitTypedValue() {
        if (value.length) return;
        const typed = typedValue.trim();
        if (!typed) return;
        const normalized = typed.startsWith('+') ? typed : `+${typed}`;
        const match =
            phonePrefixData.find((p) => p.value === normalized) ??
            (filteredPrefixes.length === 1 ? filteredPrefixes[0] : undefined);
        if (match) {
            value = [match.value];
            inputValue = match.label;
        }
    }
</script>

<div class="border border-surface-300 bg-white rounded-lg overflow-hidden">
    <Combobox
        {collection}
        {value}
        {inputValue}
        onValueChange={(e) => (value = e.value)}
        onInputValueChange={(e) => {
            inputValue = e.inputValue;
            if (e.reason === 'input-change') typedValue = e.inputValue;
            else if (e.reason === 'item-select' || e.reason === 'clear-trigger') typedValue = '';
            filteredPrefixes = phonePrefixData.filter((item) =>
                item.label.toLowerCase().includes(e.inputValue.toLowerCase()) ||
                item.value.includes(e.inputValue)
            );
        }}
        onOpenChange={(e) => {
            if (!e.open) commitTypedValue();
            filteredPrefixes = phonePrefixData;
        }}
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
