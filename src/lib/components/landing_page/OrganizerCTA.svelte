<script lang="ts">
    import { t } from '$lib/translations';
</script>

<section class="py-10 px-4 bg-surface-100-800">
    <div class="container mx-auto max-w-2xl text-center space-y-3">
        <h2 class="text-xl font-bold font-sans">{$t('landing_page.organizer_cta.title')}</h2>
        <p class="text-surface-600-300 leading-relaxed">{$t('landing_page.organizer_cta.desc')}</p>
        <div>
            <a
                href="/for-organizers"
                class="btn preset-outlined-primary-500 rounded-4xl px-5 min-h-10 text-sm justify-center"
            >
                {$t('landing_page.organizer_cta.button')}
            </a>
        </div>
    </div>
</section>
