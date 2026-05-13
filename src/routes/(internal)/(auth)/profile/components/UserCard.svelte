<script lang="ts">
    import { Avatar, Switch } from "@skeletonlabs/skeleton-svelte";
    import type { RoleAssignment } from '$lib/.prisma/generated/prisma/browser';
    import { t, locales, setLocale } from '$lib/translations';
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import ThemeLightSwitch from '$lib/components/common/ThemeLightSwitch.svelte';
    import PhonePrefixCombobox from '$lib/components/common/PhonePrefixCombobox.svelte';
    import CountryCombobox from '$lib/components/common/CountryCombobox.svelte';
    import { showErrorToast, showSuccessToast } from '$lib/utils/toast';
    import langNames from '$lib/translations/lang.json';
    import ProfileDataRow from './ProfileDataRow.svelte';

    const langMap: Record<string, string> = langNames;
    import { countries, getCountryFlag, getFlagFromPhonePrefix } from '$lib/utils/country_utils';

    let { user, account } = $props();

    // --- Editable state (synced from user prop via $effect below) ---
    let profileVisibility = $state(true);
    let resultsVisibility = $state(true);
    let nameValue = $state('');
    let countryValue: string[] = $state([]);
    let countryInputValue = $state('');
    let postalCodeValue = $state('');
    let phonePrefixValue: string[] = $state([]);
    let phonePrefixInputValue = $state('');
    let phoneNumberValue = $state('');
    let selectedLocale = $state('');

    // --- UI state ---
    let isSavingName = $state(false);
    let isSavingVisibility = $state(false);
    let isSavingLocation = $state(false);
    let isSavingPhone = $state(false);
    let isDeletingPhone = $state(false);
    let isSavingLocale = $state(false);
    let isSendingVerificationEmail = $state(false);
    let isEditingName = $state(false);
    let isEditingLocation = $state(false);
    let isEditingPhone = $state(false);
    let profileVisibilityForm: HTMLFormElement;
    let resultsVisibilityForm: HTMLFormElement;
    let localeForm: HTMLFormElement;

    let displayName = $derived(user.name || $t('profile.name_not_set'));

    // Sync all editable state from user prop (fires after form revalidation via invalidateAll)
    $effect(() => {
        profileVisibility = user.publicProfileVisibility ?? true;
        resultsVisibility = user.publicResultsVisibility ?? true;
        nameValue = user.name || '';
        countryValue = user.country ? [user.country] : [];
        countryInputValue = user.country ? (countries.find(c => c.code === user.country)?.name || '') : '';
        postalCodeValue = user.postalCode || '';
        phonePrefixValue = user.phonePrefix ? [user.phonePrefix] : [];
        phonePrefixInputValue = user.phonePrefix || '';
        phoneNumberValue = user.phoneNumber || '';
        selectedLocale = user.locale || '';
    });

    /**
     * Standardized use:enhance handler for all profile form actions.
     * Sets saving flag, calls invalidateAll() on success to refresh layout data,
     * shows error toast on failure.
     */
    function createEnhance(
        setSaving: (v: boolean) => void,
        onSuccess?: () => void,
    ) {
        return () => {
            setSaving(true);
            return async ({ result, update }: { result: any; update: (opts?: any) => Promise<void> }) => {
                setSaving(false);
                if (result.type === 'success') {
                    onSuccess?.();
                    await invalidateAll();
                } else if (result.type === 'failure') {
                    const msg = result.data?.message || result.data?.phoneError || 'Something went wrong';
                    showErrorToast(msg.includes('.') ? $t(msg) : msg);
                    await update({ reset: false });
                } else {
                    await update({ reset: false });
                }
            };
        };
    }

    function resetNameEdit() {
        nameValue = user.name || '';
        isEditingName = false;
    }

    function resetLocationEdit() {
        countryValue = user.country ? [user.country] : [];
        countryInputValue = user.country ? (countries.find(c => c.code === user.country)?.name || '') : '';
        postalCodeValue = user.postalCode || '';
        isEditingLocation = false;
    }

    function resetPhoneEdit() {
        phonePrefixValue = user.phonePrefix ? [user.phonePrefix] : [];
        phonePrefixInputValue = user.phonePrefix || '';
        phoneNumberValue = user.phoneNumber || '';
        isEditingPhone = false;
    }

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
    <div class="pb-6">
        <ProfileDataRow label={$t('profile.name')} testId="profile-name-row">
            {#snippet content()}
                {#if isEditingName}
                    <form
                        method="POST"
                        action="?/updateName"
                        use:enhance={createEnhance(
                            (v) => isSavingName = v,
                            () => { isEditingName = false; },
                        )}
                        class="space-y-3"
                    >
                        <input
                            name="name"
                            type="text"
                            class="input w-full max-w-md text-sm px-3 py-2 border rounded-lg border-surface-300 bg-white"
                            placeholder={$t('profile.name_placeholder')}
                            maxlength="80"
                            bind:value={nameValue}
                            data-testid="profile-name-input"
                            required
                        />
                        <div class="flex flex-wrap gap-2">
                            <button
                                type="submit"
                                class="btn btn-sm preset-filled-primary-500"
                                disabled={isSavingName}
                                data-testid="profile-name-save-button"
                            >
                                {isSavingName ? '...' : $t('profile.save')}
                            </button>
                            <button
                                type="button"
                                class="btn btn-sm preset-outlined-surface-500"
                                onclick={resetNameEdit}
                            >
                                {$t('profile.cancel')}
                            </button>
                        </div>
                    </form>
                {:else}
                    <p class="text-sm truncate" data-testid="profile-name-value">{displayName}</p>
                {/if}
            {/snippet}
            {#snippet action()}
                {#if !isEditingName}
                    <button
                        type="button"
                        class="btn btn-sm preset-outlined-surface-500"
                        onclick={() => isEditingName = true}
                        data-testid="profile-name-edit-button"
                    >
                        {$t('profile.change')}
                    </button>
                {/if}
            {/snippet}
        </ProfileDataRow>

        <ProfileDataRow label={$t('profile.password')} testId="profile-password-row">
            {#snippet content()}
                <p class="text-sm">••••••••</p>
            {/snippet}
            {#snippet action()}
                {#if account.provider === "credential"}
                    <a
                        class="btn btn-sm preset-outlined-surface-500"
                        href="/profile/password"
                        data-testid="change-password-trigger"
                    >
                        {$t('profile.change')}
                    </a>
                {:else}
                    <button class="btn btn-sm preset-outlined-surface-500" disabled>{$t('profile.change')}</button>
                {/if}
            {/snippet}
        </ProfileDataRow>

        <ProfileDataRow label={$t('profile.location')} testId="profile-location-row">
            {#snippet content()}
                {#if isEditingLocation}
                    <form
                        method="POST"
                        action="?/updateLocation"
                        use:enhance={createEnhance(
                            (v) => isSavingLocation = v,
                            () => { isEditingLocation = false; },
                        )}
                        class="space-y-3"
                    >
                        <div class="grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                            <input type="hidden" name="country" value={countryValue[0] || ''} />
                            <CountryCombobox
                                bind:value={countryValue}
                                bind:inputValue={countryInputValue}
                                placeholder="Select country..."
                            />
                            <input
                                name="postalCode"
                                type="text"
                                class="input text-sm px-3 py-2 border rounded-lg border-surface-300 bg-white"
                                placeholder="Postal code"
                                bind:value={postalCodeValue}
                            />
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button
                                type="submit"
                                class="btn btn-sm preset-filled-primary-500"
                                disabled={isSavingLocation}
                            >
                                {isSavingLocation ? '...' : $t('profile.save')}
                            </button>
                            <button
                                type="button"
                                class="btn btn-sm preset-outlined-surface-500"
                                onclick={resetLocationEdit}
                            >
                                {$t('profile.cancel')}
                            </button>
                        </div>
                    </form>
                {:else}
                    <p class="text-sm">
                        {#if user.country}
                            {getCountryFlag(user.country)} {getCountryName(user.country)}{user.postalCode ? `, ${user.postalCode}` : ''}
                        {:else}
                            {$t('profile.not_set')}
                        {/if}
                    </p>
                {/if}
            {/snippet}
            {#snippet action()}
                {#if !isEditingLocation}
                    <button
                        type="button"
                        class="btn btn-sm preset-outlined-surface-500"
                        onclick={() => isEditingLocation = true}
                    >
                        {$t('profile.change')}
                    </button>
                {/if}
            {/snippet}
        </ProfileDataRow>

        <ProfileDataRow label={$t('profile.phone')} testId="profile-phone-row">
            {#snippet content()}
                {#if isEditingPhone}
                    <form
                        method="POST"
                        action="?/updatePhone"
                        use:enhance={createEnhance(
                            (v) => isSavingPhone = v,
                            () => { isEditingPhone = false; },
                        )}
                        class="space-y-3"
                    >
                        <div class="grid max-w-md grid-cols-[7rem_1fr] gap-2">
                            <input type="hidden" name="phonePrefix" value={phonePrefixValue[0] || ''} />
                            <PhonePrefixCombobox
                                bind:value={phonePrefixValue}
                                bind:inputValue={phonePrefixInputValue}
                                placeholder={$t('profile.phone_prefix_placeholder')}
                                testId="phone-prefix-input"
                            />
                            <input
                                name="phoneNumber"
                                type="text"
                                class="input text-sm px-3 py-2 border rounded-lg border-surface-300 bg-white"
                                placeholder={$t('profile.phone_number_placeholder')}
                                bind:value={phoneNumberValue}
                                data-testid="phone-number-input"
                            />
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button
                                type="submit"
                                class="btn btn-sm preset-filled-primary-500"
                                disabled={isSavingPhone}
                                data-testid="phone-save-button"
                            >
                                {isSavingPhone ? '...' : $t('profile.save')}
                            </button>
                            <button
                                type="button"
                                class="btn btn-sm preset-outlined-surface-500"
                                onclick={resetPhoneEdit}
                            >
                                {$t('profile.cancel')}
                            </button>
                        </div>
                    </form>
                {:else}
                    <p class="text-sm">
                        {#if user.phonePrefix && user.phoneNumber}
                            {getFlagFromPhonePrefix(user.phonePrefix)} {user.phonePrefix} {user.phoneNumber}
                        {:else}
                            {$t('profile.phone_not_set')}
                        {/if}
                    </p>
                {/if}
            {/snippet}
            {#snippet action()}
                {#if !isEditingPhone}
                    <button
                        type="button"
                        class="btn btn-sm preset-outlined-surface-500"
                        onclick={() => isEditingPhone = true}
                        data-testid="phone-edit-button"
                    >
                        {$t('profile.change')}
                    </button>
                    {#if user.phonePrefix && user.phoneNumber}
                        <form
                            method="POST"
                            action="?/deletePhone"
                            use:enhance={createEnhance(
                                (v) => isDeletingPhone = v,
                            )}
                        >
                            <button
                                type="submit"
                                class="btn btn-sm preset-outlined-error-500"
                                disabled={isDeletingPhone}
                                data-testid="phone-delete-button"
                            >
                                {isDeletingPhone ? '...' : $t('profile.delete')}
                            </button>
                        </form>
                    {/if}
                {/if}
            {/snippet}
        </ProfileDataRow>

        <ProfileDataRow label={$t('profile.email')} testId="profile-email-row">
            {#snippet content()}
                <p class="text-sm truncate">{user.email}</p>
            {/snippet}
            {#snippet action()}
                {#if user.emailVerified}
                    <span class="badge preset-filled-success-500" data-testid="profile-email-verified-badge">
                        {$t('profile.verified')}
                    </span>
                {:else}
                    <form
                        method="POST"
                        action="?/resendVerificationEmail"
                        use:enhance={createEnhance(
                            (v) => isSendingVerificationEmail = v,
                            () => showSuccessToast($t('profile.email_verification_sent_toast')),
                        )}
                    >
                        <button
                            type="submit"
                            class="btn btn-sm preset-outlined-warning-500"
                            disabled={isSendingVerificationEmail}
                            data-testid="profile-email-resend-button"
                        >
                            {isSendingVerificationEmail ? '...' : $t('profile.send_verification_email')}
                        </button>
                    </form>
                {/if}
            {/snippet}
        </ProfileDataRow>
    </div>

    <!-- Role Badges - Centered -->
    <div class="grid grid-cols-2 gap-2 pb-4">
        <div>{$t('profile.roles')}</div>
        <div class="flex justify-end gap-2">
        <span class="badge preset-filled-surface-500" data-testid="profile-participant-role-chip">Participant</span>
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
                <span class="text-sm font-semibold text-surface-500">{$t('profile.language')}</span>
            </div>
            <div class="flex justify-end">
                <form
                    bind:this={localeForm}
                    method="POST"
                    action="?/updateLocale"
                    use:enhance={createEnhance(
                        (v) => isSavingLocale = v,
                        () => { setLocale(selectedLocale); },
                    )}
                >
                    <select
                        name="locale"
                        class="select text-sm px-3 py-2 border rounded-lg border-surface-300"
                        bind:value={selectedLocale}
                        disabled={isSavingLocale}
                        onchange={() => localeForm?.requestSubmit()}
                    >
                        <option value="">Auto</option>
                        {#each $locales as loc}
                            <option value={loc}>{langMap[loc] || loc}</option>
                        {/each}
                    </select>
                </form>
            </div>
        </div>

        <!-- Profile Visibility Setting -->
        <div class="space-y-1">
            <form
                bind:this={profileVisibilityForm}
                method="POST"
                action="?/updateVisibility"
                use:enhance={createEnhance(
                    (v) => isSavingVisibility = v,
                )}
            >
                <input type="hidden" name="field" value="publicProfileVisibility" />
                <input type="hidden" name="value" value={profileVisibility} />
                <Switch
                    checked={profileVisibility}
                    onCheckedChange={(details) => {
                        profileVisibility = details.checked;
                        const input = profileVisibilityForm?.querySelector('input[name="value"]') as HTMLInputElement;
                        if (input) input.value = String(details.checked);
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
                use:enhance={createEnhance(
                    (v) => isSavingVisibility = v,
                )}
            >
                <input type="hidden" name="field" value="publicResultsVisibility" />
                <input type="hidden" name="value" value={resultsVisibility} />
                <Switch
                    checked={resultsVisibility}
                    onCheckedChange={(details) => {
                        resultsVisibility = details.checked;
                        const input = resultsVisibilityForm?.querySelector('input[name="value"]') as HTMLInputElement;
                        if (input) input.value = String(details.checked);
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
    </div>
</div>
