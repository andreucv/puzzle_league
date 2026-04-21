<script lang="ts">
    import { Avatar, Combobox, Portal, Switch, useListCollection } from "@skeletonlabs/skeleton-svelte";
    import type { RoleAssignment } from "@prisma/client";
    import { t } from '$lib/translations';
    import { enhance } from '$app/forms';
    import ThemeLightSwitch from './ThemeLightSwitch.svelte';
    import { countries, getCountryFlag, getFlagFromPhonePrefix } from '$lib/utils/country_utils';

    let { user, account } = $props();

    let profileVisibility = $state(true);
    let resultsVisibility = $state(true);
    let isSavingVisibility = $state(false);
    let profileVisibilityForm: HTMLFormElement;
    let resultsVisibilityForm: HTMLFormElement;

    // Sync visibility state from user prop
    $effect(() => {
        profileVisibility = user.publicProfileVisibility ?? true;
        resultsVisibility = user.publicResultsVisibility ?? true;
    });

    let displayName = $derived(user.name || "Pending name...");
    let countryValue = $derived(user.country ? [user.country] : []);
    let countryInputValue = $derived(user.country ? (countries.find(c => c.code === user.country)?.name || '') : '');
    let postalCodeValue = $derived(user.postalCode || '');
    let isEditingLocation = $state(false);
    let isSavingLocation = $state(false);
    let isEditingPhone = $state(false);
    let isSavingPhone = $state(false);
    let isDeletingPhone = $state(false);
    let phonePrefixValue = $derived(user.phonePrefix ? [user.phonePrefix] : []);
    let phonePrefixInputValue = $derived(user.phonePrefix || '');
    let phoneNumberValue = $derived(user.phoneNumber || '');

    // Prepare phone prefix data from countries (deduplicated, sorted)
    const getPhonePrefixData = () => {
        const seen = new Set<string>();
        const prefixes: { label: string; value: string; emoji: string }[] = [];
        for (const c of countries) {
            if (c.phonePrefix && !seen.has(c.phonePrefix)) {
                seen.add(c.phonePrefix);
                prefixes.push({
                    label: `${getCountryFlag(c.code)} ${c.phonePrefix}`,
                    value: c.phonePrefix,
                    emoji: getCountryFlag(c.code)
                });
            }
        }
        // Put current user's prefix at the top if it exists
        if (user.phonePrefix) {
            const current = prefixes.find(p => p.value === user.phonePrefix);
            if (current) {
                const rest = prefixes.filter(p => p.value !== user.phonePrefix);
                return [current, ...rest];
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

    // Prepare country data for Combobox with current country at the top
    const getCountryData = () => {
        const allCountries = countries.map(c => ({
            label: c.name,
            value: c.code,
            emoji: getCountryFlag(c.code)
        }));

        // If user has a country, put it at the top
        if (user.country) {
            const currentCountry = allCountries.find(c => c.value === user.country);
            const otherCountries = allCountries.filter(c => c.value !== user.country);
            return currentCountry ? [currentCountry, ...otherCountries] : allCountries;
        }
        return allCountries;
    };

    const countryData = getCountryData();

    let filteredItems = $state(countryData);

    const collection = $derived(useListCollection({
        items: filteredItems,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.value,
    }));

    // Sync local state when user prop changes (after form revalidation)
    $effect(() => {
        countryValue = user.country ? [user.country] : [];
        countryInputValue = user.country ? (countries.find(c => c.code === user.country)?.name || '') : '';
        postalCodeValue = user.postalCode || '';
        phonePrefixValue = user.phonePrefix ? [user.phonePrefix] : [];
        phonePrefixInputValue = user.phonePrefix || '';
        phoneNumberValue = user.phoneNumber || '';
    });

    // Get country name from code
    const getCountryName = (code: string) => {
        return countries.find(c => c.code === code)?.name || code;
    };

    // Format date for display
    const formatDate = (date: Date | string) => {
        if (!date) return "N/A";

        const dateObj = date instanceof Date ? date : new Date(date);

        if (isNaN(dateObj.getTime())) {
            return "Invalid Date";
        }

        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        }).format(dateObj);
    };

</script>

<div class="card p-4 shadow-lg">
    <!-- Avatar Section - Centered -->
    <h3 class="text-lg font-semibold text-surface-700-300">{$t('profile.data')}</h3>
    <div class="flex justify-center pb-6">
        {#if user.image}
            <Avatar class="w-20 h-20 rounded-full border-2 border-surface-300">
                <Avatar.Image src={user.image} alt={user.name ?? 'User'} />
                <Avatar.Fallback>{user.name?.substring(0,2) ?? 'U'}</Avatar.Fallback>
            </Avatar>
            {#if account.provider === "credential"}
                <button class="btn btn-sm preset-outlined-surface-500">Change</button>
            {/if}
        {:else}
            <div class="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center">
                <span class="text-2xl font-bold text-white">
                    {user.email.charAt(0).toUpperCase()}
                </span>
            </div>
        {/if}
    </div>

    <!-- Settings Section -->
    <div class="space-y-4 pb-6">
        <!-- Name Setting -->
        <div class="grid grid-cols-2 md:grid-cols-2 gap-4 items-center">
            <div>
                <span class="text-sm font-semibold text-surface-500">Name</span>
                <p class="text-sm">{displayName}</p>
            </div>
            <div class="flex justify-end">
                <button class="btn btn-sm preset-outlined-surface-500" disabled>Change</button>
            </div>
        </div>

        <!-- Password Setting -->
        <div class="grid grid-cols-2 md:grid-cols-2 gap-4 items-center">
            <div>
                <span class="text-sm font-semibold text-surface-500">Password</span>
                <p class="text-sm">••••••••</p>
            </div>
            <div class="flex justify-end">
                <button class="btn btn-sm preset-outlined-surface-500" disabled>Change</button>
            </div>
        </div>

        <!-- Location Setting (Country + Postal Code) -->
        <div class="space-y-2">
            <span class="text-sm font-semibold text-surface-500">Location</span>
            {#if isEditingLocation}
                <form
                    method="POST"
                    action="?/updateLocation"
                    use:enhance={() => {
                        isSavingLocation = true;
                        return async ({ update }) => {
                            isSavingLocation = false;
                            isEditingLocation = false;
                            await update();
                        };
                    }}
                    class="space-y-2"
                >
                    <div class="grid grid-cols-2 md:grid-cols-1 gap-2">
                        <input type="hidden" name="country" value={countryValue[0] || ''} />
                        <div class="border border-surface-300 bg-white rounded-lg overflow-hidden">
                            <Combobox
                                {collection}
                                value={countryValue}
                                inputValue={countryInputValue}
                                onValueChange={(e) => (countryValue = e.value)}
                                onInputValueChange={(e) => {
                                    countryInputValue = e.inputValue;
                                    filteredItems = countryData.filter((item) =>
                                        item.label.toLowerCase().includes(e.inputValue.toLowerCase())
                                    );
                                }}
                                onOpenChange={() => { filteredItems = countryData; }}
                                placeholder="Select country..."
                            >
                                <Combobox.Control>
                                    <Combobox.Input class="input text-sm px-3 py-2 bg-transparent border-none w-full" />
                                    <Combobox.Trigger />
                                </Combobox.Control>
                                <Portal>
                                    <Combobox.Positioner>
                                        <Combobox.Content class="card bg-surface-50 p-2 shadow-xl max-h-48 overflow-y-auto rounded-lg">
                                            {#each collection.items as item}
                                                <Combobox.Item item={item}>
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
                        <input
                            name="postalCode"
                            type="text"
                            class="input text-sm px-3 py-2 border rounded-lg border-surface-300 bg-white"
                            placeholder="Postal code"
                            bind:value={postalCodeValue}
                        />
                    </div>
                    <div class="flex gap-2">
                        <button
                            type="submit"
                            class="btn btn-sm preset-filled-primary-500"
                            disabled={isSavingLocation}
                        >
                            {isSavingLocation ? '...' : 'Save'}
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm preset-outlined-surface-500"
                            onclick={() => { isEditingLocation = false; countryValue = user.country ? [user.country] : []; postalCodeValue = user.postalCode || ''; }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            {:else}
                <div class="flex items-center justify-between">
                    <p class="text-sm">
                        {#if user.country}
                            {getCountryFlag(user.country)} {getCountryName(user.country)}{user.postalCode ? `, ${user.postalCode}` : ''}
                        {:else}
                            Not set
                        {/if}
                    </p>
                    <button
                        class="btn btn-sm preset-outlined-surface-500"
                        onclick={() => isEditingLocation = true}
                    >
                        Change
                    </button>
                </div>
            {/if}
        </div>

        <!-- Phone Setting -->
        <div class="space-y-2">
            <span class="text-sm font-semibold text-surface-500">{$t('profile.phone')}</span>
            {#if isEditingPhone}
                <form
                    method="POST"
                    action="?/updatePhone"
                    use:enhance={() => {
                        isSavingPhone = true;
                        return async ({ update }) => {
                            isSavingPhone = false;
                            isEditingPhone = false;
                            await update();
                        };
                    }}
                    class="space-y-2"
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
                                placeholder="{$t('profile.phone_prefix_placeholder')}"
                            >
                                <Combobox.Control>
                                    <Combobox.Input
                                        class="input text-sm px-3 py-2 bg-transparent border-none w-full"
                                        data-testid="phone-prefix-input"
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
                            placeholder="{$t('profile.phone_number_placeholder')}"
                            bind:value={phoneNumberValue}
                            data-testid="phone-number-input"
                        />
                    </div>
                    <div class="flex gap-2">
                        <button
                            type="submit"
                            class="btn btn-sm preset-filled-primary-500"
                            disabled={isSavingPhone}
                            data-testid="phone-save-button"
                        >
                            {isSavingPhone ? '...' : 'Save'}
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm preset-outlined-surface-500"
                            onclick={() => { isEditingPhone = false; phonePrefixValue = user.phonePrefix ? [user.phonePrefix] : []; phonePrefixInputValue = user.phonePrefix || ''; phoneNumberValue = user.phoneNumber || ''; }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            {:else}
                <div class="flex items-center justify-between">
                    <p class="text-sm">
                        {#if user.phonePrefix && user.phoneNumber}
                            {getFlagFromPhonePrefix(user.phonePrefix)} {user.phonePrefix} {user.phoneNumber}
                        {:else}
                            {$t('profile.phone_not_set')}
                        {/if}
                    </p>
                    <div class="flex gap-2">
                        <button
                            class="btn btn-sm preset-outlined-surface-500"
                            onclick={() => isEditingPhone = true}
                            data-testid="phone-edit-button"
                        >
                            Change
                        </button>
                        {#if user.phonePrefix && user.phoneNumber}
                            <form
                                method="POST"
                                action="?/deletePhone"
                                use:enhance={() => {
                                    isDeletingPhone = true;
                                    return async ({ update }) => {
                                        isDeletingPhone = false;
                                        await update();
                                    };
                                }}
                            >
                                <button
                                    type="submit"
                                    class="btn btn-sm preset-outlined-error-500"
                                    disabled={isDeletingPhone}
                                    data-testid="phone-delete-button"
                                >
                                    {isDeletingPhone ? '...' : 'Delete'}
                                </button>
                            </form>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>

        <!-- Email/Verification Setting -->
        <span class="text-sm font-semibold text-surface-500">Email</span>
        <div class="grid grid-cols-2 md:grid-cols-2 gap-4 items-center">
            <div>
            <p class="text-sm">{user.email}</p>
            <span class="text-xs {user.emailVerified ? 'text-success-500' : 'text-warning-500'}">
                {user.emailVerified ? '✓ Verified' : '⚠ Unverified'}
            </span>
            </div>
            <div class="flex flex-col items-end gap-1">
            <span class="badge preset-filled-surface-500">{account.provider}</span>
            <span class="text-xs text-surface-400">Cannot be changed</span>
            </div>
        </div>
    </div>

    <!-- Role Badges - Centered -->
    <div class="grid grid-cols-2 gap-2 pb-4">
        <div>{$t('profile.roles')}</div>
        <div class="flex justify-end gap-2">
        {#if user.roleAssignments?.some((role: RoleAssignment) => role.role === "PARTICIPANT")}
            <span class="badge preset-filled-surface-500" data-testid="profile-participant-role-chip">Participant</span>
        {/if}
        {#if user.roleAssignments?.some((role: RoleAssignment) => role.role === "ORGANIZER")}
            <span class="badge preset-filled-primary-500" data-testid="profile-organizer-role-chip">Organizer</span>
        {/if}
        {#if user.roleAssignments?.some((role: RoleAssignment) => role.role === "ADMIN")}
            <span class="badge preset-filled-secondary-500" data-testid="profile-admin-role-chip">Admin</span>
        {/if}
        </div>
    </div>

    <!-- Member Info Section -->
    <div class="grid grid-cols-2 md:grid-cols-2 gap-4 pt-4 border-t border-surface-300">
        <div>
            <span class="text-sm font-semibold text-surface-500">Member Since</span>
            <p class="text-sm">{formatDate(user.createdAt)}</p>
        </div>
        <div class="flex flex-col items-end">
            <span class="text-sm font-semibold text-surface-500">Last Updated</span>
            <p class="text-sm">{formatDate(user.updatedAt)}</p>
        </div>
    </div>
</div>

<div class="card p-4 shadow-lg">
    <!-- Settings Section -->
    <div class="space-y-4">
        <h3 class="text-lg font-semibold text-surface-700-300">{$t('profile.preferences')}</h3>

        <!-- Language Setting -->
        <div class="grid grid-cols-2 gap-4 items-center">
            <div>
                <span class="text-sm font-semibold text-surface-500">Language</span>
                <p class="text-sm">English</p>
            </div>
            <div class="flex justify-end">
                <button class="btn btn-sm preset-outlined-surface-500" disabled>Change</button>
            </div>
        </div>

        <!-- Theme Setting -->
        <div class="grid grid-cols-2 gap-4 items-center">
            <div>
                <span class="text-sm font-semibold text-surface-500">Theme</span>
                <p class="text-sm">Light Mode</p>
            </div>
            <div class="flex justify-end">
                <ThemeLightSwitch />
            </div>
        </div>

        <!-- Profile Visibility Setting -->
        <div class="space-y-1">
            <form
                bind:this={profileVisibilityForm}
                method="POST"
                action="?/updateVisibility"
                use:enhance={() => {
                    isSavingVisibility = true;
                    return async ({ update }) => {
                        isSavingVisibility = false;
                        await update();
                    };
                }}
            >
                <input type="hidden" name="field" value="publicProfileVisibility" />
                <input type="hidden" name="value" value={!profileVisibility} />
                <Switch
                    checked={profileVisibility}
                    onCheckedChange={(details) => {
                        profileVisibility = details.checked;
                        profileVisibilityForm?.requestSubmit();
                    }}
                    disabled={isSavingVisibility}
                    class="flex justify-between items-center"
                >
                    <Switch.Label>
                        <span class="text-sm font-semibold text-surface-500">{$t('profile.public_profile_visibility')}</span>
                    </Switch.Label>
                    <Switch.Control>
                        <Switch.Thumb />
                    </Switch.Control>
                    <Switch.HiddenInput />
                </Switch>
            </form>
            <p class="text-xs text-surface-400 pl-1">{$t('profile.public_profile_visibility_description')}</p>
        </div>

        <!-- Results Visibility Setting -->
        <div class="space-y-1">
            <form
                bind:this={resultsVisibilityForm}
                method="POST"
                action="?/updateVisibility"
                use:enhance={() => {
                    isSavingVisibility = true;
                    return async ({ update }) => {
                        isSavingVisibility = false;
                        await update();
                    };
                }}
            >
                <input type="hidden" name="field" value="publicResultsVisibility" />
                <input type="hidden" name="value" value={!resultsVisibility} />
                <Switch
                    checked={resultsVisibility}
                    onCheckedChange={(details) => {
                        resultsVisibility = details.checked;
                        resultsVisibilityForm?.requestSubmit();
                    }}
                    disabled={isSavingVisibility}
                    class="flex justify-between items-center"
                >
                    <Switch.Label>
                        <span class="text-sm font-semibold text-surface-500">{$t('profile.public_results_visibility')}</span>
                    </Switch.Label>
                    <Switch.Control>
                        <Switch.Thumb />
                    </Switch.Control>
                    <Switch.HiddenInput />
                </Switch>
            </form>
            <p class="text-xs text-surface-400 pl-1">{$t('profile.public_results_visibility_description')}</p>
        </div>
        <div class="grid grid-cols-2 gap-4 items-center">
            <div>
                <span class="text-sm font-semibold text-surface-500">Time format</span>
                <p class="text-sm">24-hour</p>
            </div>
            <div class="flex justify-end">
                <button class="btn btn-sm preset-outlined-surface-500" disabled>Change</button>
            </div>
        </div>
    </div>
</div>
