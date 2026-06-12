<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { authClient } from "$lib/auth_client";
    import { t } from '$lib/translations';
    import FormInput from '$lib/components/common/FormInput.svelte';
    import { getPosthog } from '$lib/analytics/posthog';

    function trackAuthSuccess(user: { id: string; email: string; name: string }, event: string, method: string) {
        void getPosthog().then((posthog) => {
            posthog.identify(user.id, { email: user.email, name: user.name });
            posthog.capture(event, { method });
        });
    }

    let action = $state("login");
    let email = $state("");
    let name = $state("");
    let password = $state("");
    let passwordConfirm = $state("");
    let errorMessage = $state("");
    let isLoading = $state(false);

    function getInitialAction(): "login" | "register" {
        return page.url.searchParams.get('action') === 'register' ? 'register' : 'login';
    }

    function getSafeRedirect(): string {
        const redirectTo = page.url.searchParams.get('redirect');
        return redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/';
    }

    action = getInitialAction();

    async function handleSubmit() {
        if (action === 'register') {
            await registerWithEmailAndPassword();
        } else {
            await signInWithEmailAndPassword();
        }
    }

    async function signInWithEmailAndPassword() {
        if (isLoading) return;
        isLoading = true;
        errorMessage = "";
        try {
            const { data, error } = await authClient.signIn.email({ email, password });
            if (!error && data && 'user' in data && data.user) {
                trackAuthSuccess(data.user, 'user_logged_in', 'email');
            }
            await afterLogin(data, error);
        } finally {
            isLoading = false;
        }
    }

    async function registerWithEmailAndPassword() {
        if (isLoading) return;
        if (password !== passwordConfirm) {
            errorMessage = $t('auth.passwords_not_match');
            return;
        }
        isLoading = true;
        errorMessage = "";
        try {
            const { data, error } = await authClient.signUp.email({
                email, password, name, callbackURL: '/verify-email',
            });
            if (!error && data && 'user' in data && data.user) {
                trackAuthSuccess(data.user, 'user_registered', 'email');
            }
            await afterLogin(data, error);
        } finally {
            isLoading = false;
        }
    }

    async function signInWithGoogle() {
        if (isLoading) return;
        isLoading = true;
        errorMessage = "";
        try {
            const { data, error } = await authClient.signIn.social({
                provider: "google",
                callbackURL: getSafeRedirect(),
            });
            if (!error && data && 'user' in data && data.user) {
                trackAuthSuccess(data.user, 'user_logged_in', 'google');
            }
            await afterLogin(data, error);
        } finally {
            isLoading = false;
        }
    }

    function getAuthErrorKey(error: any): string {
        switch (error?.code) {
            case 'INVALID_EMAIL_OR_PASSWORD': return 'auth.errors.invalid_credentials';
            case 'USER_ALREADY_EXISTS': return 'auth.errors.email_already_exists';
            default: return 'auth.errors.unexpected';
        }
    }

    async function afterLogin(data: any, error: any) {
        if (error) {
            errorMessage = $t(getAuthErrorKey(error));
            console.error(error);
            return;
        }
        // Social sign-in handles its own redirect (data.redirect = true)
        if (data?.redirect) return;
        const redirect = getSafeRedirect();
        await goto(redirect);
    }
</script>

<!--
    Layout: full-height flex column so the secondary action (Create account / Back to login)
    is pinned to the bottom of the visible screen while the form floats vertically centered.

    Why calc(100dvh - 3.5rem):
    - `dvh` (dynamic viewport height) adapts to mobile browser chrome that hides/shows on scroll,
      unlike `vh` which can cause content to be clipped on iOS Safari.
    - `3.5rem` (56 px) subtracts the AppBar height rendered by the root layout above this page.
      The (internal) layout also adds pb-4 (16 px) below, but that's negligible for centering.
    - `min-h` (not `h`) lets the section grow if the register form is taller than the viewport,
      keeping content accessible rather than clipped.
-->
<section class="flex flex-col min-h-[calc(100dvh-7rem)] max-w-md mx-auto px-6">

    <div class="flex-1 flex items-center justify-center">
        <div class="w-full space-y-4">
            <h4 data-testid="login-title" class="h4 text-center">
                {action === "register" ? $t('auth.register_title') : $t('auth.login_title')}
            </h4>

            <form class="space-y-3" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <FormInput
                    bind:value={email}
                    type="email"
                    id="input_email"
                    name="email"
                    data-testid="input-email"
                    placeholder={$t('auth.enter_email')}
                    autocomplete="email"
                    required
                />

                {#if action === "register"}
                    <FormInput
                        bind:value={name}
                        id="input_name"
                        name="name"
                        data-testid="input-name"
                        placeholder={$t('auth.enter_name')}
                        autocomplete="name"
                        required
                    />
                {/if}

                <FormInput
                    bind:value={password}
                    type="password"
                    id="input_password"
                    name="password"
                    data-testid="input-password"
                    placeholder={$t('auth.enter_password')}
                    minlength={5}
                    autocomplete={action === 'register' ? 'new-password' : 'current-password'}
                    required
                />

                {#if action === "register"}
                    <FormInput
                        bind:value={passwordConfirm}
                        type="password"
                        id="input_password_confirm"
                        name="password_confirm"
                        data-testid="input-password-confirm"
                        placeholder={$t('auth.confirm_password_placeholder')}
                        minlength={5}
                        autocomplete="new-password"
                        required
                    />
                {/if}

                {#if errorMessage}
                    <div id="login_error_message" data-testid="login-error-message" class="text-error-500 text-sm">{errorMessage}</div>
                {/if}

                <button
                    id="login_submit"
                    data-testid={action === 'register' ? 'register-submit' : 'login-submit'}
                    type="submit"
                    disabled={isLoading}
                    class="btn preset-filled-primary-500 w-full"
                >
                    {#if action === 'register'}
                        {isLoading ? $t('auth.registering') : $t('auth.register_button')}
                    {:else}
                        {isLoading ? $t('auth.logging_in') : $t('auth.login_button')}
                    {/if}
                </button>

                {#if action === "login"}
                    <p class="text-center text-sm">
                        <a href="/forgot-password" data-testid="forgot-password-link" class="anchor">
                            {$t('auth.forgot_password')}
                        </a>
                    </p>
                {/if}
            </form>

            <div class="flex items-center">
                <hr class="grow border-t border-surface-300" />
                <span class="mx-4 text-surface-500 text-sm">{$t('auth.or_separator')}</span>
                <hr class="grow border-t border-surface-300" />
            </div>

            <button
                class="btn preset-outlined-surface-200-800 w-full"
                disabled={isLoading}
                onclick={signInWithGoogle}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                </svg>
                <span>{$t('auth.sign_in_with_google')}</span>
            </button>
        </div>
    </div>

    <!-- Secondary action pinned to the bottom, separated by a border -->
    <div class="py-6 border-t border-surface-300">
        {#if action === "login"}
            <button
                id="create-account-button"
                data-testid="create-account-link"
                class="btn preset-outlined-primary-500 w-full"
                onclick={() => { action = "register"; }}
            >
                {$t('auth.create_account_link')}
            </button>
        {:else}
            <p class="text-center">
                {$t('auth.have_account')}
                <a
                    href="#top"
                    data-testid="sign-in-link"
                    onclick={(e) => { e.preventDefault(); action = "login"; }}
                    class="anchor font-semibold"
                >{$t('auth.sign_in_link')}</a>
            </p>
        {/if}
    </div>

</section>
