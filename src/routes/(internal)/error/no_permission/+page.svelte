<script>
    import { goto } from '$app/navigation';
</script>

<div class="error-container">
    <h1>Access Denied</h1>
    <p>Sorry, you don't have permission to access this area.</p>
    <button on:click={() => goto('/')}>Return to Home</button>
</div>

<style>
    .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        text-align: center;
        padding: 1rem;
    }

    h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }

    p {
        font-size: 1.2rem;
        color: #555;
        margin-bottom: 2rem;
    }
</style>
