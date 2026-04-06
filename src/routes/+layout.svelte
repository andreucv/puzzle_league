<script lang="ts">
    import '../app.css';
    import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
    import Header from '$lib/components/Header.svelte';
    import Footer from '$lib/components/Footer.svelte';
    import CloseIcon from '@iconify-svelte/mdi/close';

    let {children, data} = $props();
    import { drawerState } from '../shareds/drawer.svelte';

    // Lazy-load DrawerNav to reduce initial JS bundle — only loaded when drawer is first opened
    let DrawerNav = $state<typeof import('$lib/components/DrawerNav.svelte').default | null>(null);
    let drawerEverOpened = $state(false);

    $effect(() => {
        if (drawerState.open && !drawerEverOpened) {
            drawerEverOpened = true;
            import('$lib/components/DrawerNav.svelte').then(m => { DrawerNav = m.default; });
        }
    });

    // CSS transition classes for backdrop and drawer panel
    const animBackdrop = 'transition transition-discrete opacity-0 starting:data-[state=open]:opacity-0 data-[state=open]:opacity-100';
    const animDrawer = 'transition transition-discrete opacity-0 -translate-x-full starting:data-[state=open]:opacity-0 starting:data-[state=open]:-translate-x-full data-[state=open]:opacity-100 data-[state=open]:translate-x-0';
</script>

<Dialog open={drawerState.open} onOpenChange={(e) => { drawerState.open = e.open; }}>
    <Portal>
        <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50/75 dark:bg-surface-950/75 {animBackdrop}" />
        <Dialog.Positioner class="fixed inset-0 z-50 flex justify-start">
            <Dialog.Content class="h-screen bg-surface-100-900 shadow-xl w-[320px] overflow-y-auto {animDrawer}">
                <nav class="drawer-nav flex flex-col h-full">
                    <!-- Header -->
                    <div class="flex items-center justify-between px-5 pt-5 pb-3">
                        <h2 class="h4 font-sans" style="font-weight: 800; font-stretch: 125%;"><a href="/" onclick={() => { drawerState.open = false; }}>PuzzLigas</a></h2>
                        <Dialog.CloseTrigger data-testid="nav-drawer-close-button" class="p-1.5 rounded-full hover:bg-surface-200-800 transition-colors">
                            <CloseIcon width="1.25rem" height="1.25rem" />
                        </Dialog.CloseTrigger>
                    </div>

                    {#if DrawerNav}
                        <DrawerNav user={data.user} />
                    {/if}
                </nav>
            </Dialog.Content>
        </Dialog.Positioner>
    </Portal>
</Dialog>
<Header/>
<div id="layout-start">
{@render children()}
</div>
<!-- {#if !data.user || currentPath.includes("footer")} -->
{#if !data.user}
<Footer />
{/if}
