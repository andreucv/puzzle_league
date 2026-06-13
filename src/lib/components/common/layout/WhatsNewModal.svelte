<script lang="ts">
    import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
    import CloseIcon from '@iconify-svelte/mdi/close';
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { locale } from '$lib/translations';
    import en from '$lib/translations/en/whats-new.json';
    import es from '$lib/translations/es/whats-new.json';
    import ca from '$lib/translations/ca/whats-new.json';

    type Release = {
        version: string;
        status?: string;
        date?: string | null;
        title: string;
        summary: string;
        highlights?: string[];
    };
    type Content = { heading: string; draftBadge: string; dismiss: string; releases: Release[] };

    const content = { en, es, ca } as unknown as Record<string, Content>;
    const STORAGE_KEY = 'whatsNewLastSeen';

    let isPreview: boolean = $derived(page.data.isPreview ?? false);
    let active: Content = $derived(content[$locale] ?? content.en);

    let open = $state(false);
    let shown = $state<Release[]>([]);

    // Parse "x.y.z" into a comparable tuple; missing/garbage segments -> 0.
    function parse(v: string | null): number[] {
        if (!v) return [0, 0, 0];
        return v.split('.').map((n) => Number.parseInt(n, 10) || 0);
    }
    // Is semver `a` strictly newer than `b`? (drafts use version "next" and are
    // handled separately, never compared here)
    function isNewer(a: string, b: string | null): boolean {
        const pa = parse(a);
        const pb = parse(b);
        for (let i = 0; i < 3; i++) {
            if ((pa[i] ?? 0) > (pb[i] ?? 0)) return true;
            if ((pa[i] ?? 0) < (pb[i] ?? 0)) return false;
        }
        return false;
    }
    function highest(list: Release[]): string | null {
        return list.reduce<string | null>((max, r) => (isNewer(r.version, max) ? r.version : max), null);
    }

    // Decide once, client-side, whether to surface the modal on load.
    onMount(() => {
        const releases = active.releases ?? [];
        const released = releases.filter((r) => r.status !== 'draft');
        const drafts = releases.filter((r) => r.status === 'draft');

        // First-ever visit: baseline to the latest release so we don't replay
        // the whole history — users only see What's New for future releases.
        if (localStorage.getItem(STORAGE_KEY) === null) {
            const top = highest(released);
            if (top) localStorage.setItem(STORAGE_KEY, top);
        }

        const baseline = localStorage.getItem(STORAGE_KEY);
        const unseen = released.filter((r) => isNewer(r.version, baseline));
        // Preview also surfaces in-progress drafts so QA sees what's coming.
        const toShow = isPreview ? [...drafts, ...unseen] : unseen;

        if (toShow.length > 0) {
            shown = toShow;
            open = true;
        }
    });

    function dismiss() {
        open = false;
        // Mark seen up to the newest released entry; drafts never advance the baseline.
        const top = highest(shown.filter((r) => r.status !== 'draft'));
        if (top) localStorage.setItem(STORAGE_KEY, top);
    }
</script>

<Dialog {open} onOpenChange={(e) => { if (!e.open) dismiss(); }}>
    <Portal>
        <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50/75 dark:bg-surface-950/75" />
        <Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Content class="card bg-surface-100-900 shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="h4 font-sans" style="font-weight: 800; font-stretch: 125%;">{active.heading}</h2>
                    <Dialog.CloseTrigger data-testid="whats-new-close-button" class="p-1.5 rounded-full hover:bg-surface-200-800 transition-colors">
                        <CloseIcon width="1.25rem" height="1.25rem" />
                    </Dialog.CloseTrigger>
                </div>

                <div class="space-y-6">
                    {#each shown as release (release.version)}
                        <section>
                            <header class="flex items-baseline gap-2">
                                <h3 class="h5 font-semibold">{release.title}</h3>
                                {#if release.status === 'draft'}
                                    <span class="badge preset-tonal text-xs">{active.draftBadge}</span>
                                {:else}
                                    <span class="text-xs font-mono text-surface-500">v{release.version}</span>
                                {/if}
                            </header>
                            <p class="mt-1 text-sm text-surface-700-300">{release.summary}</p>
                            {#if release.highlights?.length}
                                <ul class="mt-2 list-disc list-inside text-sm space-y-1">
                                    {#each release.highlights as highlight}
                                        <li>{highlight}</li>
                                    {/each}
                                </ul>
                            {/if}
                        </section>
                    {/each}
                </div>

                <div class="mt-6 flex justify-end">
                    <button type="button" class="btn preset-filled" onclick={dismiss}>{active.dismiss}</button>
                </div>
            </Dialog.Content>
        </Dialog.Positioner>
    </Portal>
</Dialog>
