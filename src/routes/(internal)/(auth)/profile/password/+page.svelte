<script lang="ts">
    import type { PageData } from './$types';
    import { goto } from '$app/navigation';
    import { authClient } from '$lib/auth_client';
    import { t } from '$lib/translations';
    import Card from '$lib/components/common/card/Card.svelte';
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';
    import PasswordUpdateForm from '$lib/components/common/auth/PasswordUpdateForm.svelte';
    import type { PasswordUpdatePayload } from '$lib/components/common/auth/PasswordUpdateForm.svelte';

    let { data }: { data: PageData } = $props();

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
                setTimeout(() => goto('/profile'), 2000);
            }
        } catch {
            changePasswordError = 'Something went wrong';
        } finally {
            isChangingPassword = false;
        }
    }
</script>

<div class="container mx-auto max-w-lg px-4 space-y-4">
    <TitleBackButton href="/profile" text={$t('auth.change_password_title')} />

    <Card>
        {#if data.account.provider === 'credential'}
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
        {:else}
            <p class="text-sm text-surface-600-400">{$t('profile.password_not_available')}</p>
        {/if}
    </Card>
</div>
