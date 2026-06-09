<script lang="ts">
    import { page } from '$app/state';
    import { t } from '$lib/translations';

    // "Create an account" prompt shared by both guides. These routes are reachable pre-
    // and post-login, so we hide it for authenticated users (who already have an account).
    // `user` is populated by the root +layout.server.ts. The organizer variant drops the
    // "free" wording: organizer accounts are free today, but platform usage is something
    // we intend to monetize, so we avoid promising it.
    let { variant = 'participant' }: { variant?: 'participant' | 'organizer' } = $props();

    const isAuthed = $derived(!!page.data.user);
    const textKey = $derived(
        variant === 'organizer'
            ? 'how_it_works_guides.account_cta.text_organizer'
            : 'how_it_works_guides.account_cta.text'
    );
</script>

{#if !isAuthed}
    <div class="card preset-tonal-primary flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
        <p class="text-sm font-medium">{$t(textKey)}</p>
        <div class="flex gap-2 shrink-0">
            <a href="/login" class="btn btn-sm preset-outlined-primary-500 rounded-4xl">
                {$t('how_it_works_guides.account_cta.sign_in')}
            </a>
            <a href="/login?action=register" class="btn btn-sm preset-filled-primary-500 rounded-4xl">
                {$t('how_it_works_guides.account_cta.create_account')}
            </a>
        </div>
    </div>
{/if}
