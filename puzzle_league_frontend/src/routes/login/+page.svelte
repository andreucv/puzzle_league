<script lang="ts">
    import { goto, invalidateAll } from "$app/navigation";
    import { getFirebaseClient } from "$lib/firebase/client";
    import {
        signInWithPopup,
        GoogleAuthProvider,
        signInWithEmailAndPassword as _signInWithEmailAndPassword,
        createUserWithEmailAndPassword,
    } from "firebase/auth";

    const googleProvider = new GoogleAuthProvider();
    const auth = getFirebaseClient();

    async function sendIdToken(idToken: string): Promise<void> {
        try {
            const res = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    idToken,
                }),
            });
            invalidateAll();
            console.log("After login", res);
        } catch (err) {
            console.error(err);
        }
    }

    // Functions to interact with Firebase Auth
    export async function signInWithEmailAndPassword(email, password) {
        try {
            const user = await _signInWithEmailAndPassword(auth, email, password);
            const idToken = await user.user.getIdToken();
            await sendIdToken(idToken);
            goto("/");
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
            const user = await createUserWithEmailAndPassword(auth, email, password);
            const idToken = await user.user.getIdToken();
            await sendIdToken(idToken);
            goto("/");
        } catch (error) {
            console.error(error);
        } finally {
            auth.signOut();
        }
    }
    export async function signInWithGoogle() {
        try {
            const user = await signInWithPopup(auth, googleProvider);
            const idToken = await user.user.getIdToken();
            await sendIdToken(idToken);
            goto('/');
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

    async function handleSubmit() {
        if (!email || !password || (action == "register" && !passwordConfirm)) {
            alert("Please fill in all fields");
            return;
        }

        if (action == "register") {
            if (password != passwordConfirm) {
                alert("Passwords do not match");
                return;
            }

            try {
                registerUserWithEmailAndPassword(email, password);
            } catch (error) {
                console.error(error);
            }
        } else if (action == "login") {
            try {
                let result = await signInWithEmailAndPassword(email, password);
            } catch (error) {
                console.error(error);
                switch (error.code) {
                    case "auth/invalid-credential":
                        alert(
                            "Provided credential is invalid. Did you login with Google?",
                        );
                        break;
                    default:
                        alert("An error occurred");
                }
            }
        }
    }
</script>

<section class="flex flex-col md:mt-40 h-screen m-4">
    <div
        class="w-full md:max-w-md lg:max-w-full md:mx-auto md:mx-0 md:w-1/2 xl:w-1/3 mt-6 lg:px-16 xl:px-12
          flex items-center justify-center">
        <div class="w-full h-100">
            <h1 class="text-xl md:text-2xl font-bold leading-tight">
                Log in to your account
            </h1>

            <button
                class="mt-4 w-full bg-white hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
                on:click={signInWithGoogle}>
                <svg class="mr-2" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                </svg>
                <span>Log in with Google</span>
            </button>
            <div class="flex items-center my-4">
                <hr class="flex-grow border-t border-gray-300">
                <span class="mx-4 text-gray-500">or</span>
                <hr class="flex-grow border-t border-gray-300">
            </div>
            
        
        <div>
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
        
                <button on:click={handleSubmit} class="w-full block bg-indigo-500 hover:bg-indigo-400 focus:bg-indigo-400 text-white font-semibold rounded-lg
                      px-4 py-3 mt-4">{action == "register" ? "Register" : "Log In"}</button>
            </form>
        
            <hr class="border-gray-300 w-full" />
        
            {#if action == "login"}
                <p class="mt-8">
                    Not registered yet?
                    <a
                        href="#"
                        id="create-account-button"
                        on:click={() => (action = "register")}
                        class="text-indigo-500 hover:text-indigo-700 font-semibold"
                        >Create an account</a
                    >
                </p>
                <a href="#" class="text-indigo-500 hover:text-indigo-700 font-semibold"
                    >Forgot Password?</a
                >
            {:else}
                <p class="mt-8">
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
    </div>
</section>
