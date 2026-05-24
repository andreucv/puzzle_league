<script lang="ts">
    import { t } from '$lib/translations';
    import { enhance } from '$app/forms';
    import Card from '$lib/components/common/card/Card.svelte';
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
    import { createEnhanceHandler } from '$lib/utils/form_enhance';
    import { showSuccessToast, showErrorToast } from '$lib/utils/toast';
    import Icon from '@iconify/svelte';

    let {
        userEmail,
        isActive,
        isSubmitting = $bindable(false),
        onSuccess,
    }: {
        userEmail: string;
        isActive: boolean;
        isSubmitting?: boolean;
        onSuccess: () => void | Promise<void>;
    } = $props();

    let isResendingEmail = $state(false);
    let emailResent = $state(false);
    let emailResendFailed = $state(false);
    let toastShown = $state(false);

    // Show toast only when this step becomes the active step (not on mount,
    // because all wizard steps are mounted at once and hidden with CSS).
    $effect(() => {
        if (isActive && !toastShown) {
            toastShown = true;
            // Automatically send the verification email when step becomes active
            fetch('?/resendVerificationEmail', {
                method: 'POST',
                body: new FormData(),
            });
            showSuccessToast(
                $t('onboarding.verify_email_toast_title'),
                $t('onboarding.verify_email_toast_description', { email: userEmail }),
            );
        }
    });

    function createResendEnhanceHandler() {
        return () => {
            isResendingEmail = true;
            emailResent = false;
            emailResendFailed = false;
            return async ({ result }: { result: any }) => {
                isResendingEmail = false;
                if (result.type === 'success') {
                    emailResent = true;
                    showSuccessToast(
                        $t('onboarding.verify_email_resent'),
                        $t('onboarding.verify_email_toast_description', { email: userEmail }),
                    );
                } else {
                    emailResendFailed = true;
                    showErrorToast($t('onboarding.verify_email_resend_error'));
                }
            };
        };
    }
</script>

<div data-testid="onboarding-step-verify-email">
    <GenericTitle text={$t('onboarding.verify_email_title')} />

    <Card>
        <div class="text-center space-y-4 py-4">
            <Icon icon="mdi:email-check-outline" width="3rem" height="3rem" class="text-primary-500 mx-auto" />

            <p class="text-surface-600 dark:text-surface-400">
                {$t('onboarding.verify_email_sent', { email: userEmail })}
            </p>

            <p class="text-sm text-surface-500 dark:text-surface-400">
                {$t('onboarding.verify_email_check')}
            </p>

            {#if emailResent}
                <div data-testid="onboarding-verify-email-resent-banner" class="p-3 rounded-lg preset-filled-success-500 text-sm flex items-center justify-center gap-2">
                    <Icon icon="mdi:check-circle" width="1.2rem" height="1.2rem" />
                    <span>{$t('onboarding.verify_email_resent')}</span>
                </div>
            {/if}

            {#if emailResendFailed}
                <div class="p-3 rounded-lg preset-filled-error-500 text-sm flex items-center justify-center gap-2">
                    <Icon icon="mdi:alert-circle" width="1.2rem" height="1.2rem" />
                    <span>{$t('onboarding.verify_email_resend_error')}</span>
                </div>
            {/if}

            <form
                method="POST"
                action="?/resendVerificationEmail"
                use:enhance={createResendEnhanceHandler()}
            >
                <button
                    type="submit"
                    disabled={isResendingEmail}
                    class="btn preset-outlined-primary-500 w-full"
                    data-testid="onboarding-verify-email-resend"
                >
                    <Icon icon="mdi:email-sync-outline" width="1.2rem" height="1.2rem" />
                    {isResendingEmail ? $t('onboarding.verify_email_resending') : $t('onboarding.verify_email_resend')}
                </button>
            </form>
        </div>
    </Card>

    <form
        method="POST"
        action="?/skipEmailVerification"
        use:enhance={createEnhanceHandler(
            () => {},
            'error',
            {
                onSuccess,
                setSubmitting: (v) => (isSubmitting = v),
            }
        )}
    >
        <button
            type="submit"
            class="btn preset-tonal w-full"
            disabled={isSubmitting}
            data-testid="onboarding-verify-email-skip"
        >
            {$t('onboarding.continue_to_homepage')}
        </button>
    </form>
</div>
