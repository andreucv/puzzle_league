<script lang="ts">
    import { t } from '$lib/translations';
    import AccountPlusIcon from '@iconify-svelte/mdi/account-plus';
    import LoginIcon from '@iconify-svelte/mdi/login';

    let {
        loggedIn,
        registrationOpen,
        isOrganizer = false,
        hasOpenSpot,
        hasRegistrations = false,
        registrationHref,
        loginHref,
        testId = 'signup-button'
    }: {
        loggedIn: boolean;
        registrationOpen: boolean;
        isOrganizer?: boolean;
        hasOpenSpot: boolean;
        hasRegistrations?: boolean;
        registrationHref: string;
        loginHref: string;
        testId?: string;
    } = $props();

    type ButtonState =
        | { kind: 'login' }
        | { kind: 'enabled'; label: string }
        | { kind: 'disabled'; label: string; reason: string };

    // Organizers bypass open/capacity checks. Users who already hold a registration
    // can always reach it (to view/cancel), even when the competition is full or closed.
    const state = $derived.by((): ButtonState => {
        if (!loggedIn) {
            return { kind: 'login' };
        }

        const canRegister = isOrganizer || (registrationOpen && hasOpenSpot);
        if (hasRegistrations || canRegister) {
            return {
                kind: 'enabled',
                label: hasRegistrations
                    ? $t('competition_details.view_registration')
                    : $t('competition_details.register_now')
            };
        }

        return {
            kind: 'disabled',
            label: $t('competition_details.register_now'),
            reason: registrationOpen
                ? $t('competition_details.registration_full_banner')
                : $t('competition_details.registration_closed_banner')
        };
    });
</script>

{#if state.kind === 'login'}
    <a href={loginHref} class="btn preset-filled-primary-500" data-testid={testId}>
        <div class="flex flex-col items-center gap-1">
            <div class="flex items-center gap-2">
                <LoginIcon width="1.2rem" height="1.2rem" />
                <p class="flex-0">{$t('competition_details.login_to_register_button')}</p>
            </div>
            <p class="text-xs">{$t('competition_details.login_to_register')}</p>
        </div>
    </a>
{:else if state.kind === 'enabled'}
    <a href={registrationHref} class="btn preset-filled-success-500" data-testid={testId}>
        <AccountPlusIcon width="1.2rem" height="1.2rem" />
        {state.label}
    </a>
{:else}
    <button class="btn preset-filled-success-500" disabled data-testid={testId}>
        <div class="flex flex-col items-center gap-1">
            <div class="flex items-center gap-2">
                <AccountPlusIcon width="1.2rem" height="1.2rem" />
                <p class="flex-0">{state.label}</p>
            </div>
            <p class="text-xs">{state.reason}</p>
        </div>
    </button>
{/if}
