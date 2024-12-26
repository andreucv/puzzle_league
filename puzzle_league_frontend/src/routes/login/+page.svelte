<!-- This is login form
 includes
 1. user email and password fields, 
 2. a link to reset password
 3. social auth login buttons (google)
-->

<script>
    import UserForm from "$lib/components/UserForm.svelte";
    import { signInWithGoogle as _signInWithGoogle } from "$lib/firebase/client";

    async function signInWithGoogle() {
        try {
            await _signInWithGoogle();
        } catch (error) {
            console.error(error);
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
                class="mt-4 w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                on:click={() => {signInWithGoogle()}}>
                Log in with Google
            </button>
            <UserForm action="login" />
        </div>
    </div>
</section>
