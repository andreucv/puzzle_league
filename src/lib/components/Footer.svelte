<footer class="mt-10">
    <div class="footer-content">
        <div class="footer-section">
            <a href="/footer/privacy_policy">Privacy Policy</a>
            <a href="/footer/terms_of_service">Terms of Service</a>
        </div>
        <div class="footer-section">
            <p>© 2025 Puzzligas. All rights reserved.</p>
        </div>
    </div>
</footer>

<style>
    footer {
        background-color: #1a1a1a;
        color: #fff;
        padding: 2rem 0;
    }

    .footer-content {
        max-width: 1200px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
        padding: 0 1rem;
    }

    .footer-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    a {
        color: #ccc;
        text-decoration: none;
        transition: color 0.2s;
    }

    a:hover {
        color: #fff;
    }

    @media (min-width: 1200px) {
        .footer-content {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1rem;
        }
    }
</style>
