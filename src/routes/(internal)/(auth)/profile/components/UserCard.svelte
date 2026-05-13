<script lang="ts">
    import { Avatar, Switch, Dialog } from "@skeletonlabs/skeleton-svelte";
    import type { RoleAssignment } from "@prisma/client";
    import { t, locale, locales, setLocale } from '$lib/translations';
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import ThemeLightSwitch from '$lib/components/common/ThemeLightSwitch.svelte';
    import PhonePrefixCombobox from '$lib/components/common/PhonePrefixCombobox.svelte';
    import CountryCombobox from '$lib/components/common/CountryCombobox.svelte';
    import { showErrorToast } from '$lib/utils/toast';
    import { authClient } from '$lib/auth_client';
    import PasswordUpdateForm from '$lib/components/common/auth/PasswordUpdateForm.svelte';
    import type { PasswordUpdatePayload } from '$lib/components/common/auth/PasswordUpdateForm.svelte';
    import langNames from '$lib/translations/lang.json';

    const langMap: Record<string, string> = langNames;
    import { countries, getCountryFlag, getFlagFromPhonePrefix } from '$lib/utils/country_utils';

    let { user, account } = $props();

    // --- Editable state (synced from user prop via $effect below) ---
    let profileVisibility = $state(true);
    let resultsVisibility = $state(true);
    let countryValue: string[] = $state([]);
    let countryInputValue = $state('');
    let postalCodeValue = $state('');
    let phonePrefixValue: string[] = $state([]);
    let phonePrefixInputValue = $state('');
    let phoneNumberValue = $state('');
    let selectedLocale = $state('');

    // --- UI state ---
    let isSavingVisibility = $state(false);
    let isSavingLocation = $state(false);
    let isSavingPhone = $state(false);
    let isDeletingPhone = $state(false);
    let isSavingLocale = $state(false);
    let isEditingLocation = $state(false);
    let isEditingPhone = $state(false);
    let profileVisibilityForm: HTMLFormElement;
    let resultsVisibilityForm: HTMLFormElement;
    let localeForm: HTMLFormElement;

    // --- Change Password Dialog state ---
    let showChangePasswordDialog = $state(false);
    let isChangingPassword = $state(false);
    let changePasswordError = $state('');
    let changePasswordSuccess = $state('');
    let passwordFormRef: { reset: () => void } | undefined = $state(undefined);

    async function handleChangePassword(payload: PasswordUpdatePayload) {
        isChangingPassword = true;
        changePasswordError = '';
        changePasswordSuccess = '';

        try {
            const { error } = await authClient.changePassword({
                newPassword: payload.newPassword,
                currentPassword: payload.currentPassword!,
                revokeOtherSessions: payload.revokeOtherSessions ?? false,
            });

            if (error) {
                changePasswordError = error.message || 'Something went wrong';
            } else {
                changePasswordSuccess = $t('auth.reset_password_success');
                passwordFormRef?.reset();
                // Close dialog after a brief delay so user sees the success message
                setTimeout(() => {
                    showChangePasswordDialog = false;
                    changePasswordSuccess = '';
                }, 2000);
            }
        } catch {
            changePasswordError = 'Something went wrong';
        } finally {
            isChangingPassword = false;
        }
    }

    let displayName = $derived(user.name || "Pending name...");

    // Sync all editable state from user prop (fires after form revalidation via invalidateAll)
    $effect(() => {
        profileVisibility = user.publicProfileVisibility ?? true;
        resultsVisibility = user.publicResultsVisibility ?? true;
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
                {#if account.provider === "credential"}
                    <button
                        class="btn btn-sm preset-outlined-surface-500"
                        data-testid="change-password-trigger"
                        onclick={() => showChangePasswordDialog = true}
                    >
                        Change
                    </button>
                {:else}
                    <button class="btn btn-sm preset-outlined-surface-500" disabled>Change</button>
                {/if}
            </div>
        </div>

        <!-- Location Setting (Country + Postal Code) -->
        <div class="space-y-2">
            <span class="text-sm font-semibold text-surface-500">Location</span>
            {#if isEditingLocation}
                <form
                    method="POST"
                    action="?/updateLocation"
                    use:enhance={createEnhance(
                        (v) => isSavingLocation = v,
                        () => { isEditingLocation = false; },
                    )}
                    class="space-y-2"
                >
                    <div class="grid grid-cols-2 md:grid-cols-1 gap-2">
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
                    use:enhance={createEnhance(
                        (v) => isSavingPhone = v,
                        () => { isEditingPhone = false; },
                    )}
                    class="space-y-2"
                >
                    <div class="grid grid-cols-[7rem_1fr] gap-2">
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
            {#if user.emailVerified}
                <span class="text-xs text-success-500">✓ Verified</span>
            {:else}
                <a href="/onboarding" class="text-xs text-warning-500 underline hover:text-warning-600 inline-flex items-center gap-1">
                    <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-warning-500"></span>
                    </span>
                    ⚠ Unverified
                </a>
            {/if}
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

<!-- Change Password Dialog -->
<Dialog open={showChangePasswordDialog} onOpenChange={(e) => { showChangePasswordDialog = e.open; if (!e.open) { changePasswordError = ''; changePasswordSuccess = ''; } }}>
    <Dialog.Backdrop class="fixed inset-0 z-50 bg-black/50" />
    <Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Dialog.Content class="card preset-outlined-surface-200-800 p-6 max-w-md w-full space-y-4">
            <h3 class="text-lg font-semibold" data-testid="change-password-dialog-title">{$t('auth.change_password_title')}</h3>
            <PasswordUpdateForm
                bind:this={passwordFormRef}
                showCurrentPassword={true}
                showRevokeOtherSessions={true}
                submitLabel={$t('auth.change_password_button')}
                loading={isChangingPassword}
                errorMessage={changePasswordError}
                successMessage={changePasswordSuccess}
                testIdPrefix="change-password"
                onsubmit={handleChangePassword}
            />
            <Dialog.CloseTrigger class="btn btn-sm preset-outlined-surface-500 w-full" data-testid="change-password-cancel">
                Cancel
            </Dialog.CloseTrigger>
        </Dialog.Content>
    </Dialog.Positioner>
</Dialog>
