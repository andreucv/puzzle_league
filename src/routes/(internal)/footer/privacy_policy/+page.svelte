<script>
    import { t, locale } from '$lib/translations';
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
</script>

<div class="container mx-auto max-w-3xl space-y-6">
    <GenericTitle text={$t('legal.privacy_policy')} />
    <p class="text-sm text-surface-500">{$t('legal.last_updated')}</p>

    {#if $locale !== 'es'}
        <aside class="text-sm italic text-warning-500">
            {$t('legal.authoritative_language_notice')}
        </aside>
    {/if}

    <Card>
        <div class="space-y-6">
            <p>{$t('legal.pp.intro')}</p>
            <p>{$t('legal.pp.data_controller')}</p>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">1. {$t('legal.pp.data_collected.title')}</h2>
                <p>{$t('legal.pp.data_collected.intro')}</p>
                <ul class="list-disc pl-6 space-y-1">
                    <li>{$t('legal.pp.data_collected.personal')}</li>
                    <li>{$t('legal.pp.data_collected.contact')}</li>
                    <li>{$t('legal.pp.data_collected.location')}</li>
                    <li>{$t('legal.pp.data_collected.account')}</li>
                    <li>{$t('legal.pp.data_collected.session')}</li>
                    <li>{$t('legal.pp.data_collected.competition')}</li>
                    <li>{$t('legal.pp.data_collected.automatic')}</li>
                </ul>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">2. {$t('legal.pp.how_we_use.title')}</h2>
                <p>{$t('legal.pp.how_we_use.intro')}</p>
                <ul class="list-disc pl-6 space-y-1">
                    <li>{$t('legal.pp.how_we_use.service')}</li>
                    <li>{$t('legal.pp.how_we_use.communication')}</li>
                    <li>{$t('legal.pp.how_we_use.security')}</li>
                    <li>{$t('legal.pp.how_we_use.analytics')}</li>
                    <li>{$t('legal.pp.how_we_use.legal')}</li>
                </ul>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">3. {$t('legal.pp.legal_basis.title')}</h2>
                <p>{$t('legal.pp.legal_basis.intro')}</p>
                <ul class="list-disc pl-6 space-y-1">
                    <li>{$t('legal.pp.legal_basis.contract')}</li>
                    <li>{$t('legal.pp.legal_basis.consent')}</li>
                    <li>{$t('legal.pp.legal_basis.legitimate_interest')}</li>
                </ul>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">4. {$t('legal.pp.third_parties.title')}</h2>
                <p>{$t('legal.pp.third_parties.intro')}</p>
                <p>{$t('legal.pp.third_parties.categories')}</p>
                <p class="font-medium">{$t('legal.pp.third_parties.no_selling')}</p>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">5. {$t('legal.pp.data_retention.title')}</h2>
                <p>{$t('legal.pp.data_retention.intro')}</p>
                <p>{$t('legal.pp.data_retention.deletion')}</p>
                <p>{$t('legal.pp.data_retention.sessions')}</p>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">6. {$t('legal.pp.your_rights.title')}</h2>
                <p>{$t('legal.pp.your_rights.intro')}</p>
                <ul class="list-disc pl-6 space-y-1">
                    <li>{$t('legal.pp.your_rights.access')}</li>
                    <li>{$t('legal.pp.your_rights.rectification')}</li>
                    <li>{$t('legal.pp.your_rights.erasure')}</li>
                    <li>{$t('legal.pp.your_rights.restriction')}</li>
                    <li>{$t('legal.pp.your_rights.portability')}</li>
                    <li>{$t('legal.pp.your_rights.objection')}</li>
                </ul>
                <p>{$t('legal.pp.your_rights.how_to_exercise')}</p>
                <p>{$t('legal.pp.your_rights.complaint')}</p>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">7. {$t('legal.pp.cookies.title')}</h2>
                <p>{$t('legal.pp.cookies.description')}</p>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">8. {$t('legal.pp.children.title')}</h2>
                <p>{$t('legal.pp.children.description')}</p>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">9. {$t('legal.pp.security.title')}</h2>
                <p>{$t('legal.pp.security.description')}</p>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">10. {$t('legal.pp.changes.title')}</h2>
                <p>{$t('legal.pp.changes.description')}</p>
            </section>

            <section class="space-y-2">
                <h2 class="h4 font-semibold">11. {$t('legal.pp.contact.title')}</h2>
                <p>{$t('legal.pp.contact.description')}</p>
                <p>{$t('legal.pp.contact.email')}</p>
            </section>
        </div>
    </Card>
</div>
