<script lang="ts">
    import { auth_helpers } from "$lib/firebase/auth_helpers";

    let email = '';
    let password = '';
    let passwordConfirm = '';
    
    export let action : string;

    async function handleSubmit() {
        if (!email || !password || (action == "register" && !passwordConfirm)) {
            alert('Please fill in all fields');
            return;
        }

        if (action == "register") {
            if (password != passwordConfirm) {
                alert('Passwords do not match');
                return;
            }
            
            try {
                auth_helpers.register(email, password);
            } catch (error) {
                console.error(error);
            }
        } else if (action == "login") {
            try {
                auth_helpers.login(email, password);
            } catch (error) {
                console.error(error);
            }
        } 
    }
</script>

<div>
    <form class="mt-2">
        <div>
          <label for="input_email" class="block">Email</label>
          <input bind:value={email} name="email" id="input_email" placeholder="Enter Email" class="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border text-black focus:border-indigo-500 focus:bg-white focus:outline-none" required>
        </div>

        <div class="mt-4">
          <div class="flex items-center justify-between">
            <label for="input_password">Password</label>
            <a href="#" class="text-sm font-semibold text-indigo-500 focus:text-indigo-700">Forgot Password?</a>
          </div>
          <input bind:value={password} type="password" name="password" id="input_password" placeholder="Enter Password" minlength="5" class="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border text-black focus:border-indigo-500
                focus:bg-white focus:outline-none" required>
          {#if action == "register"}
            <input bind:value={passwordConfirm} type="password" name="password_confirm" id="input_password_confirm" placeholder="Confirm Password" minlength="5" class="w-full px-4 py-3 rounded-lg bg-gray-200 mt-2 border text-black focus:border-indigo-500
                focus:bg-white focus:outline-none" required>
          {/if}
        </div>

        <button on:click={handleSubmit} class="w-full block bg-indigo-500 hover:bg-indigo-400 focus:bg-indigo-400 text-white font-semibold rounded-lg
              px-4 py-3 mt-4">{action == "register" ? "Register" : "Log In"}</button>
      </form>

      <hr class="border-gray-300 w-full">

    {#if action == "login"}
      <p class="mt-8">Not registered yet? 
        <a href="#" on:click={() => action = "register"} class="text-indigo-500 hover:text-indigo-700 font-semibold">Create an account</a>
      </p>
    {:else}
      <p class="mt-8">Already have an account? 
        <a href="#" on:click={() => action = "login"} class="text-indigo-500 hover:text-indigo-700 font-semibold">Sign in</a>
      </p>
    {/if}

</div>