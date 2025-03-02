<script lang="ts">
    import { goto, invalidateAll } from "$app/navigation";
    import { getFirebaseClient } from "$lib/firebase/client";
    import {
        signInWithPopup,
        GoogleAuthProvider,
        FacebookAuthProvider,
        signInWithEmailAndPassword as _signInWithEmailAndPassword,
        createUserWithEmailAndPassword,
    } from "firebase/auth";

    const googleProvider = new GoogleAuthProvider();
    const facebookProvider = new FacebookAuthProvider();
    const auth = getFirebaseClient();

    async function sendIdToken(idToken: string, user: any): Promise<void> {
        try {
            // Extract only the necessary properties from the user object
            // Firebase User object has a complex structure - we need to safely extract the data
            const userData = {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || null,
                photoURL: user.photoURL || null,
                providerId: user.providerId || 'unknown'
            };

            // First call our server API to check/create the user in our database
            const userApiResponse = await fetch("/api/user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    idToken,
                    userData
                }),
            });

            if (!userApiResponse.ok) {
                const errorData = await userApiResponse.json();
                throw new Error(errorData.message || "Failed to process user data");
            }

            // Send the token to backend for session management
            const res = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    idToken,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to create session");
            }

            await invalidateAll();
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    // Functions to interact with Firebase Auth
    export async function signInWithEmailAndPassword(email, password) {
        try {
            const userCredential = await _signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();
            await sendIdToken(idToken, userCredential.user);
            await goto("/");
        } catch (error) {
            const _error = await error;
            console.error("FirebaseClient: error", _error);
            throw new Error(_error);
        } finally {
            auth.signOut();
        }
    }

    export async function registerUserWithEmailAndPassword(email, password) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();
            await sendIdToken(idToken, userCredential.user);
            await goto("/");
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            auth.signOut();
        }
    }

    export async function signInWithGoogle() {
        try {
            const userCredential = await signInWithPopup(auth, googleProvider);
            const idToken = await userCredential.user.getIdToken();

            // Get user info from the credential
            const userData = userCredential.user;

            // Make sure providerId is set correctly
            userData.providerId = 'google.com';

            await sendIdToken(idToken, userData);
            await goto("/");
        } catch (err) {
            console.error(err);
        } finally {
            auth.signOut();
        }
    }

    export async function signInWithFacebook() {
        try {
            const userCredential = await signInWithPopup(auth, facebookProvider);
            const idToken = await userCredential.user.getIdToken();

            // Get user info from the credential
            const userData = userCredential.user;

            // Make sure providerId is set correctly
            userData.providerId = 'facebook.com';

            await sendIdToken(idToken, userData);
            await goto("/");
        } catch (err) {
            console.error(err);
        } finally {
            auth.signOut();
        }
    }

    let email = "";
    let password = "";
    let passwordConfirm = "";
    let action: string = "login";
    let errorMessage = "";

    async function handleSubmit() {
        errorMessage = "";

        if (!email || !password || (action == "register" && !passwordConfirm)) {
            errorMessage = "Please fill in all fields";
            return;
        }

        if (action == "register") {
            if (password != passwordConfirm) {
                errorMessage = "Passwords do not match";
                return;
            }

            try {
                await registerUserWithEmailAndPassword(email, password);
            } catch (error) {
                console.error(error);
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = "Email is already in use";
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = "Password is too weak";
                } else {
                    errorMessage = "Failed to register: " + error.message;
                }
            }
        } else if (action == "login") {
            try {
                await signInWithEmailAndPassword(email, password);
            } catch (error) {
                console.error(error);
                if (error.code === 'auth/invalid-credential') {
                    errorMessage = "Invalid email or password";
                } else if (error.code === 'auth/user-not-found') {
                    errorMessage = "User not found";
                } else {
                    errorMessage = "Failed to login: " + error.message;
                }
            }
        }
    }
</script>

<section class="flex flex-col md:mt-40 h-screen">
    <div
        class="w-full md:max-w-md lg:max-w-full md:mx-auto md:mx-0 md:w-1/2 xl:w-1/3 mt-4 lg:px-16 xl:px-12
          flex items-center justify-center">
        <div class="w-full h-100">
            <h1 class="text-xl md:text-2xl font-bold leading-tight">
                {action === "register" ? "Create an account" : "Log in to your account"}
            </h1>

            <div class="mt-6">
                <form class="mt-2">
                    <div>
                        <label for="input_email" class="block">Email</label>
                        <input
                            bind:value={email}
                            name="email"
                            id="input_email"
                            placeholder="Enter Email"
                            class="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border text-black focus:border-indigo-500 focus:bg-white focus:outline-none"
                            required
                        />
                    </div>

                    <div class="mt-4">
                        <div class="flex items-center justify-between">
                            <label for="input_password">Password</label>
                        </div>
                        <input bind:value={password} type="password" name="password" id="input_password" placeholder="Enter Password" minlength="5" class="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border text-black focus:border-indigo-500
                            focus:bg-white focus:outline-none"
                            required />
                        {#if action == "register"}
                            <input bind:value={passwordConfirm} type="password" name="password_confirm" id="input_password_confirm"
                                placeholder="Confirm Password" minlength="5" class="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border text-black focus:border-indigo-500
                            focus:bg-white focus:outline-none" required />
                        {/if}
                    </div>

                    {#if errorMessage}
                        <div class="text-red-500 mt-2 text-sm">{errorMessage}</div>
                    {/if}

                    <button type="button" on:click={handleSubmit} class="w-full block bg-indigo-500 hover:bg-indigo-400 focus:bg-indigo-400 text-white font-semibold rounded-lg
                          px-4 py-3 mt-4">{action == "register" ? "Register" : "Log In"}</button>
                </form>
            </div>

            <div class="flex items-center my-4">
                <hr class="flex-grow border-t border-gray-300">
                <span class="mx-4 text-gray-500">or</span>
                <hr class="flex-grow border-t border-gray-300">
            </div>

            <div class="space-y-3">
                <button
                    class="w-full bg-white hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center justify-center border"
                    on:click={signInWithGoogle}>
                    <svg class="mr-2" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                    </svg>
                    <span>Log in with Google</span>
                </button>

                <button
                    class="w-full bg-[#4267B2] hover:bg-[#365899] text-white font-bold py-2 px-4 rounded inline-flex items-center justify-center"
                    on:click={signInWithFacebook}>
                    <svg class="mr-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
                    </svg>
                    <span>Log in with Facebook</span>
                </button>
            </div>

            <hr class="border-gray-300 w-full my-4" />

            {#if action == "login"}
                <p class="mt-4">
                    Not registered yet?
                    <a
                        href="#"
                        id="create-account-button"
                        on:click={() => (action = "register")}
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
                        on:click={() => (action = "login")}
                        class="text-indigo-500 hover:text-indigo-700 font-semibold"
                        >Sign in</a
                    >
                </p>
            {/if}
        </div>
    </div>
</section>
