<script>
    import { t, locale } from '$lib/translations';
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
</script>

<div class="container mx-auto max-w-3xl space-y-6">
    <GenericTitle text={$t('legal.terms_of_service')} />
    <p class="text-sm text-surface-500">{$t('legal.last_updated')}</p>

    {#if $locale !== 'es'}
        <aside class="text-sm italic text-warning-500">
            {$t('legal.authoritative_language_notice')}
        </aside>
    {/if}

    <Card>
        <div class="space-y-6">
            <p>{$t('legal.tos.intro')}</p>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">1. {$t('legal.tos.acceptance.title')}</h2>
                <p>{$t('legal.tos.acceptance.description')}</p>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">2. {$t('legal.tos.eligibility.title')}</h2>
                <p>{$t('legal.tos.eligibility.description')}</p>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">3. {$t('legal.tos.accounts.title')}</h2>
                <ul class="list-disc pl-6 space-y-1">
                    <li>{$t('legal.tos.accounts.accuracy')}</li>
                    <li>{$t('legal.tos.accounts.security')}</li>
                    <li>{$t('legal.tos.accounts.termination')}</li>
                </ul>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">4. {$t('legal.tos.use_of_service.title')}</h2>
                <p>{$t('legal.tos.use_of_service.permitted')}</p>
                <p class="font-medium">{$t('legal.tos.use_of_service.prohibited_title')}</p>
                <ul class="list-disc pl-6 space-y-1">
                    <li>{$t('legal.tos.use_of_service.prohibited_1')}</li>
                    <li>{$t('legal.tos.use_of_service.prohibited_2')}</li>
                    <li>{$t('legal.tos.use_of_service.prohibited_3')}</li>
                    <li>{$t('legal.tos.use_of_service.prohibited_4')}</li>
                    <li>{$t('legal.tos.use_of_service.prohibited_5')}</li>
                    <li>{$t('legal.tos.use_of_service.prohibited_6')}</li>
                </ul>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">5. {$t('legal.tos.competitions.title')}</h2>
                <p>{$t('legal.tos.competitions.fair_play')}</p>
                <p>{$t('legal.tos.competitions.results')}</p>
                <p>{$t('legal.tos.competitions.organizer_responsibility')}</p>
                <p>{$t('legal.tos.competitions.liability')}</p>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">6. {$t('legal.tos.content.title')}</h2>
                <p>{$t('legal.tos.content.user_content')}</p>
                <p>{$t('legal.tos.content.moderation')}</p>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">7. {$t('legal.tos.intellectual_property.title')}</h2>
                <p>{$t('legal.tos.intellectual_property.platform')}</p>
                <p>{$t('legal.tos.intellectual_property.user_data')}</p>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">8. {$t('legal.tos.liability.title')}</h2>
                <p>{$t('legal.tos.liability.disclaimer')}</p>
                <p>{$t('legal.tos.liability.limitation')}</p>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">9. {$t('legal.tos.paid_features.title')}</h2>
                <p>{$t('legal.tos.paid_features.description')}</p>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">10. {$t('legal.tos.governing_law.title')}</h2>
                <p>{$t('legal.tos.governing_law.description')}</p>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">11. {$t('legal.tos.changes.title')}</h2>
                <p>{$t('legal.tos.changes.description')}</p>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">12. {$t('legal.tos.severability.title')}</h2>
                <p>{$t('legal.tos.severability.description')}</p>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">13. {$t('legal.tos.contact.title')}</h2>
                <p>{$t('legal.tos.contact.description')}</p>
                <p>{$t('legal.tos.contact.email')}</p>
            </section>
        </div>
    </Card>
</div>
