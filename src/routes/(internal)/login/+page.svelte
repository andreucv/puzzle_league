<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { authClient } from "$lib/auth_client";
    import { t } from '$lib/translations';

    let action = $state("login");
    let email = $state("");
    let name = $state("");
    let password = $state("");
    let passwordConfirm = $state("");
    let errorMessage = $state("");
    let isLoading = $state(false);

    async function signInWithEmailAndPassword() {
        if (isLoading) return;
        isLoading = true;
        errorMessage = "";
        try {
            const { data, error } = await authClient.signIn.email({
                email,
                password,
            });
            await after_login(data, error);
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
                email,
                password,
                name,
                callbackURL: '/verify-email',
            });
            await after_login(data, error);
        } finally {
            isLoading = false;
        }
    }

    async function signInWithGoogle() {
        if (isLoading) return;
        isLoading = true;
        errorMessage = "";
        try {
            const redirectTo = page.url.searchParams.get('redirect');
            const callbackURL = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/';
            const { data, error } = await authClient.signIn.social({
                provider: "google",
                callbackURL
            });
            await after_login(data, error);
        } finally {
            isLoading = false;
        }
    }

    async function after_login(data: any, error: any) {
        if (error) {
            errorMessage = String(error?.message);
            console.error(error);
            return;
        }
        // Social sign-in handles its own redirect (data.redirect = true)
        if (data?.redirect) return;

        const redirectTo = page.url.searchParams.get('redirect');
        // Sanitize: only allow relative paths starting with /
        const safeRedirect = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/';
        await goto(safeRedirect);
    }
</script>

<section class="flex flex-col md:mt-40 h-screen">
    <div
        class="w-full md:max-w-md lg:max-w-full md:mx-auto md:w-1/2 xl:w-1/3 mt-4 lg:px-16 xl:px-12
          flex items-center justify-center">
        <div class="w-full h-100">
            <h1 data-testid="login-title" class="text-xl md:text-2xl font-bold leading-tight">
                {action === "register" ? $t('auth.register_title') : $t('auth.login_title')}
            </h1>

            <div class="mt-6">
                <form class="mt-2" onsubmit={(e) => { e.preventDefault(); action === 'register' ? registerWithEmailAndPassword() : signInWithEmailAndPassword(); }}>
                    <div>
                        <label for="input_email" class="block">{$t('auth.email_label')}</label>
                        <input
                            bind:value={email}
                            name="email"
                            id="input_email"
                            data-testid="input-email"
                            placeholder={$t('auth.enter_email')}
                            autocomplete="email"
                            class="w-full px-4 py-3 rounded-lg bg-surface-200 mt-2 border text-surface-900 focus:border-primary-500 focus:bg-surface-50 focus:outline-none"
                            required
                        />
                    </div>
                    {#if action == "register"}
                        <div class="mt-2">
                            <label for="input_name" class="block">{$t('auth.name_label')}</label>
                            <input
                                bind:value={name}
                                name="name"
                                id="input_name"
                                data-testid="input-name"
                                placeholder={$t('auth.enter_name')}
                                autocomplete="name"
                                class="w-full px-4 py-3 rounded-lg bg-surface-200 mt-2 border text-surface-900 focus:border-primary-500 focus:bg-surface-50 focus:outline-none"
                                required
                            />
                        </div>
                    {/if}
                    <div class="mt-4">
                        <div class="flex items-center justify-between">
                            <label for="input_password">{$t('auth.password_label')}</label>
                        </div>
                        <input bind:value={password} type="password" name="password" id="input_password" data-testid="input-password" placeholder={$t('auth.enter_password')} minlength="5" autocomplete={action === 'register' ? 'new-password' : 'current-password'} class="w-full px-4 py-3 rounded-lg bg-surface-200 mt-2 border text-surface-900 focus:border-primary-500
                            focus:bg-surface-50 focus:outline-none"
                            required />
                        {#if action == "register"}
                            <input bind:value={passwordConfirm} type="password" name="password_confirm" id="input_password_confirm"
                                data-testid="input-password-confirm" placeholder={$t('auth.confirm_password_placeholder')} minlength="5" autocomplete="new-password" class="w-full px-4 py-3 rounded-lg bg-surface-200 mt-2 border text-surface-900 focus:border-primary-500
                            focus:bg-surface-50 focus:outline-none" required />
                        {/if}
                    </div>

                    {#if errorMessage}
                        <div id="login_error_message" data-testid="login-error-message" class="text-error-500 mt-2 text-sm">{errorMessage}</div>
                    {/if}

                    {#if action == "register"}
                        <button id="login_submit" data-testid="register-submit" type="submit" disabled={isLoading} class="w-full block bg-primary-500 hover:bg-primary-400 focus:bg-primary-400 text-white font-semibold rounded-lg
                          px-4 py-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed">{#if isLoading}{$t('auth.registering')}{:else}{$t('auth.register_button')}{/if}</button>
                    {/if}
                    {#if action == "login"}
                        <button id="login_submit" data-testid="login-submit" type="submit" disabled={isLoading} class="w-full block bg-primary-500 hover:bg-primary-400 focus:bg-primary-400 text-white font-semibold rounded-lg
                            px-4 py-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed">{#if isLoading}{$t('auth.logging_in')}{:else}{$t('auth.login_button')}{/if}</button>
                    {/if}
                </form>
            </div>

            <div class="flex items-center my-4">
                <hr class="grow border-t border-surface-300">
                <span class="mx-4 text-surface-500">{$t('auth.or_separator')}</span>
                <hr class="grow border-t border-surface-300">
            </div>

            <div class="space-y-3">
                <button
                    class="w-full bg-surface-50 hover:bg-surface-100 text-surface-800 dark:text-surface-200 font-bold py-2 px-4 rounded inline-flex items-center justify-center border disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                    onclick={signInWithGoogle}>
                    <svg class="mr-2" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                    </svg>
                    <span>{$t('auth.sign_in_with_google')}</span>
                </button>
            </div>

            <hr class="border-surface-300 w-full my-4" />

            {#if action == "login"}
                <p class="mt-4">
                    {$t('auth.no_account')}
                    <a
                        href="#top"
                        id="create-account-button"
                        data-testid="create-account-link"
                        onclick={(e) => { e.preventDefault(); action = "register"; }}
                        class="text-primary-500 hover:text-primary-700 font-semibold"
                        >{$t('auth.create_account_link')}</a
                    >
                </p>
                <p class="mt-2">
                    <a href="/forgot-password" data-testid="forgot-password-link" class="text-primary-500 hover:text-primary-700 font-semibold"
                        >{$t('auth.forgot_password')}</a>
                </p>
            {:else}
                <p class="mt-4">
                    {$t('auth.have_account')}
                    <a
                        href="#top"
                        data-testid="sign-in-link"
                        onclick={(e) => { e.preventDefault(); action = "login"; }}
                        class="text-primary-500 hover:text-primary-700 font-semibold"
                        >{$t('auth.sign_in_link')}</a
                    >
                </p>
            {/if}
        </div>
    </div>
</section>
