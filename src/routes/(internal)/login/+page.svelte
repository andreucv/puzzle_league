<script lang="ts">
    import { goto } from "$app/navigation";
    import { authClient } from "$lib/auth_client";
    import { t } from '$lib/translations';

    let action = "login";
    let email = "";
    let name = "";
    let password = "";
    let passwordConfirm = "";
    let errorMessage : string = "";
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
            errorMessage = "Passwords do not match";
            return;
        }
        isLoading = true;
        errorMessage = "";
        try {
            const { data, error } = await authClient.signUp.email({
                email,
                password,
                name
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
            const { data, error } = await authClient.signIn.social({
                provider: "google"
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
        if (data) {
            if (!data.redirect) {
                goto("/");
            }
        }
    }
</script>

<section class="flex flex-col md:mt-40 h-screen">
    <div
        class="w-full md:max-w-md lg:max-w-full md:mx-auto md:mx-0 md:w-1/2 xl:w-1/3 mt-4 lg:px-16 xl:px-12
          flex items-center justify-center">
        <div class="w-full h-100">
            <h1 data-testid="login-title" class="text-xl md:text-2xl font-bold leading-tight">
                {action === "register" ? $t('auth.register_title') : $t('auth.login_title')}
            </h1>

            <div class="mt-6">
                <form class="mt-2">
                    <div>
                        <label for="input_email" class="block">Email</label>
                        <input
                            bind:value={email}
                            name="email"
                            id="input_email"
                            data-testid="input-email"
                            placeholder="Enter Email"
                            class="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border text-black focus:border-indigo-500 focus:bg-white focus:outline-none"
                            required
                        />
                    </div>
                    {#if action == "register"}
                        <div class="mt-2">
                            <label for="input_name" class="block">Name</label>
                            <input
                                bind:value={name}
                                name="name"
                                id="input_name"
                                data-testid="input-name"
                                placeholder="Enter Name"
                                class="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border text-black focus:border-indigo-500 focus:bg-white focus:outline-none"
                                required
                            />
                        </div>
                    {/if}
                    <div class="mt-4">
                        <div class="flex items-center justify-between">
                            <label for="input_password">Password</label>
                        </div>
                        <input bind:value={password} type="password" name="password" id="input_password" data-testid="input-password" placeholder="Enter Password" minlength="5" class="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border text-black focus:border-indigo-500
                            focus:bg-white focus:outline-none"
                            required />
                        {#if action == "register"}
                            <input bind:value={passwordConfirm} type="password" name="password_confirm" id="input_password_confirm"
                                data-testid="input-password-confirm" placeholder="Confirm Password" minlength="5" class="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border text-black focus:border-indigo-500
                            focus:bg-white focus:outline-none" required />
                        {/if}
                    </div>

                    {#if errorMessage}
                        <div id="login_error_message" data-testid="login-error-message" class="text-red-500 mt-2 text-sm">{errorMessage}</div>
                    {/if}

                    {#if action == "register"}
                        <button id="login_submit" data-testid="register-submit" type="button" onclick={registerWithEmailAndPassword} disabled={isLoading} class="w-full block bg-indigo-500 hover:bg-indigo-400 focus:bg-indigo-400 text-white font-semibold rounded-lg
                          px-4 py-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed">{#if isLoading}Registering...{:else}Register{/if}</button>
                    {/if}
                    {#if action == "login"}
                        <button id="login_submit" data-testid="login-submit" type="button" onclick={signInWithEmailAndPassword} disabled={isLoading} class="w-full block bg-indigo-500 hover:bg-indigo-400 focus:bg-indigo-400 text-white font-semibold rounded-lg
                            px-4 py-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed">{#if isLoading}Logging in...{:else}Log In{/if}</button>
                    {/if}
                </form>
            </div>

            <div class="flex items-center my-4">
                <hr class="grow border-t border-gray-300">
                <span class="mx-4 text-gray-500">or</span>
                <hr class="grow border-t border-gray-300">
            </div>

            <div class="space-y-3">
                <button
                    class="w-full bg-white hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center justify-center border disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                    onclick={signInWithGoogle}>
                    <svg class="mr-2" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                    </svg>
                    <span>Log in with Google</span>
                </button>

                <!-- <button
                    class="w-full bg-[#4267B2] hover:bg-[#365899] text-white font-bold py-2 px-4 rounded inline-flex items-center justify-center"
                    onclick={signInWithFacebook}>
                    <svg class="mr-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
                    </svg>
                    <span>Log in with Facebook</span>
                </button> -->
            </div>

            <hr class="border-gray-300 w-full my-4" />

            {#if action == "login"}
                <p class="mt-4">
                    Not registered yet?
                    <a
                        href="#"
                        id="create-account-button"
                        data-testid="create-account-link"
                        onclick={(e) => { e.preventDefault(); action = "register"; }}
                        class="text-indigo-500 hover:text-indigo-700 font-semibold"
                        >Create an account</a
                    >
                </p>
                <p class="mt-2">
                    <a href="#" class="text-indigo-500 hover:text-indigo-700 font-semibold"
                        >Forgot Password?</a>
                </p>
            {:else}
                <p class="mt-4">
                    Already have an account?
                    <a
                        href="#"
                        data-testid="sign-in-link"
                        onclick={(e) => { e.preventDefault(); action = "login"; }}
                        class="text-indigo-500 hover:text-indigo-700 font-semibold"
                        >Sign in</a
                    >
                </p>
            {/if}
        </div>
    </div>
</section>
