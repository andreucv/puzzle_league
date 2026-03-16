<script lang="ts">
    import type { Competition, Category } from '$lib/.prisma/generated/prisma/browser';
    import type { CategoryType } from '$lib/.prisma/generated/prisma/browser';
    import { Carousel } from '@skeletonlabs/skeleton-svelte';
    import { CldImage } from 'svelte-cloudinary';
    import Icon from '@iconify/svelte';
    import { getCategoryTypeName, getCategoryTypeIcon } from '$lib/utils/category_utils';
    import CalendarIcon from '@iconify-svelte/mdi/calendar';
    import MapMarkerIcon from '@iconify-svelte/mdi/map-marker';
    import ChevronLeftIcon from '@iconify-svelte/mdi/chevron-left';
    import ChevronRightIcon from '@iconify-svelte/mdi/chevron-right';
    import { MediaQuery } from 'svelte/reactivity';

    type CompetitionWithCategories = Competition & {
        categories: Category[];
    };

    interface Props {
        competitions: CompetitionWithCategories[];
    }

    let { competitions }: Props = $props();

    const lgScreen = new MediaQuery('(min-width: 1024px)');
    const slidesPerPage = $derived(lgScreen.current ? 3 : 2);

    function daysUntil(date: Date): string {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(date);
        target.setHours(0, 0, 0, 0);
        const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Tomorrow';
        if (diff < 0) return `${Math.abs(diff)}d ago`;
        return `In ${diff}d`;
    }
</script>

{#if competitions.length > 0}
    <Carousel
        slideCount={competitions.length}
        slidesPerPage={slidesPerPage}
        spacing="12px"
        padding="0px"
        loop
        allowMouseDrag
    >
        <div class="relative">
            <!-- Overlapping navigation arrows -->
            <Carousel.Control>
                <Carousel.PrevTrigger class="btn-icon preset-filled-surface-100-900 rounded-full absolute top-[50%] left-0 translate-y-[-50%] z-20 shadow-lg opacity-80 hover:opacity-100 transition-opacity">
                    <ChevronLeftIcon width="1.5rem" height="1.5rem" />
                </Carousel.PrevTrigger>
                <Carousel.NextTrigger class="btn-icon preset-filled-surface-100-900 rounded-full absolute top-[50%] right-0 translate-y-[-50%] z-20 shadow-lg opacity-80 hover:opacity-100 transition-opacity">
                    <ChevronRightIcon width="1.5rem" height="1.5rem" />
                </Carousel.NextTrigger>
            </Carousel.Control>

            <Carousel.ItemGroup>
                {#each competitions as competition, i (competition.id)}
                    <Carousel.Item index={i}>
                        <a href="/competitions/competition_details/{competition.id}" class="block group">
                            <div class="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 h-72 sm:h-80">
                                <!-- Competition Image -->
                                {#if competition.image_cld_id}
                                    <CldImage
                                        src={competition.image_cld_id}
                                        width="600"
                                        height="400"
                                        alt={competition.name}
                                        crop="fill"
                                        gravity="auto"
                                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                    />
                                {:else}
                                    <div class="w-full h-full bg-linear-to-br from-primary-200 via-primary-300 to-primary-500 dark:from-primary-800 dark:via-primary-700 dark:to-primary-900 flex items-center justify-center">
                                        <Icon icon="mdi:puzzle" class="w-20 h-20 text-white/30" />
                                    </div>
                                {/if}

                                <!-- Date badge (top-right) -->
                                <div class="absolute top-3 right-3 z-10">
                                    <div class="bg-white/90 dark:bg-surface-800/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-md text-center">
                                        <span class="block text-lg font-bold text-primary-700 dark:text-primary-300 leading-tight">
                                            {new Date(competition.startDate).getDate()}
                                        </span>
                                        <span class="block text-[0.65rem] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                                            {new Date(competition.startDate).toLocaleString('default', { month: 'short' })}
                                        </span>
                                    </div>
                                </div>

                                <!-- Days-until pill (top-left) -->
                                <div class="absolute top-3 left-3 z-10">
                                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-surface-800/90 backdrop-blur-sm text-surface-700 dark:text-surface-200 shadow-md">
                                        <CalendarIcon width="0.85rem" height="0.85rem" />
                                        {daysUntil(competition.startDate)}
                                    </span>
                                </div>

                                <!-- Dark gradient overlay (bottom) -->
                                <div class="absolute inset-x-0 bottom-0 h-[55%] bg-linear-to-t from-black/99 via-black/60 to-transparent pointer-events-none"></div>

                                <!-- Content overlay -->
                                <div class="absolute inset-x-0 bottom-0 p-4 sm:p-5 z-10 flex flex-col gap-2.5">

                                    <!-- Competition name -->
                                    <h3 class="text-xl sm:text-2xl font-bold text-white leading-tight drop-shadow-md line-clamp-2">
                                        {competition.name}
                                    </h3>

                                    <!-- Category chips -->
                                    {#if competition.categories && competition.categories.length > 0}
                                        <div class="flex items-center gap-1.5 flex-wrap">
                                            {#each competition.categories as category (category.id)}
                                                {@const CategoryIcon = getCategoryTypeIcon(category.type as CategoryType)}
                                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-medium bg-white/20 backdrop-blur-sm text-white border border-white/20 shadow-sm">
                                                    <CategoryIcon width="0.75rem" height="0.75rem" />
                                                </span>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </a>
                    </Carousel.Item>
                {/each}
            </Carousel.ItemGroup>
        </div>

        <!-- Dot indicators -->
        <Carousel.IndicatorGroup class="flex justify-center gap-2 mt-4">
            <Carousel.Context>
                {#snippet children(carousel)}
                    {#each carousel().pageSnapPoints as _, index (index)}
                        <Carousel.Indicator {index} class="w-2 h-2 rounded-full bg-surface-300 dark:bg-surface-600 data-current:bg-primary-500 data-current:w-6 transition-all duration-300" />
                    {/each}
                {/snippet}
            </Carousel.Context>
        </Carousel.IndicatorGroup>
    </Carousel>
{:else}
    <p class="text-center text-surface-500 dark:text-surface-400 py-4">No upcoming competitions nearby.</p>
{/if}
