
<script lang="ts">
	import CompetitionCard from '$lib/components/competition/CompetitionCard.svelte';
	import InfiniteScroll from '$lib/components/InfiniteScroll.svelte';
	import { t } from '$lib/translations';
	import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
	import type { Competition } from '@prisma/client';

	let { data } = $props();
	let competitions = $state<Competition[]>(data.competitions);
	let page = $state(1);
	let hasMore = $state(true);

	async function loadMore() {
		const currentMonth = new Date().getMonth();
		const currentYear = new Date().getFullYear();
		const nextMonth = (currentMonth + page) % 12;
		const nextYear = currentYear + Math.floor((currentMonth + page) / 12);

		const res = await fetch(`/api/competitions/bymonth/${nextMonth}/${nextYear}`);
		if (res.ok) {
			const newCompetitions = await res.json();
			if (newCompetitions.length > 0) {
				// Sort new competitions by date before adding them
				newCompetitions.sort(
					(a: Competition, b: Competition) =>
						new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
				);
				competitions = [...competitions, ...newCompetitions];
				page++;
			} else {
				hasMore = false;
			}
		} else {
			hasMore = false;
		}
	}

	function groupCompetitionsByDate(competitions: Competition[]) {
		return competitions.reduce(
			(groups, competition) => {
				const date = new Date(competition.startDate).toDateString();
				if (!groups[date]) {
					groups[date] = [];
				}
				groups[date].push(competition);
				return groups;
			},
			{} as Record<string, Competition[]>
		);
	}

	let groupedCompetitions = $derived.by(() => {
		const sortedCompetitions = [...competitions].sort(
			(a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
		);
		return groupCompetitionsByDate(sortedCompetitions);
	});
</script>

<svelte:head>
	<title>{$t('competitions.upcoming_competitions')}</title>
</svelte:head>

<GenericTitle text={$t('competitions.upcoming_competitions')} />
<div class="container mx-auto">
	{#if competitions.length > 0}
		{#each Object.entries(groupedCompetitions) as [date, comps]}
			<h5 class="h5 my-2">
				{new Date(date).toLocaleDateString(undefined, {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})}
			</h5>
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each comps as competition (competition.id)}
					<CompetitionCard {competition} noShowCategories={true} />
				{/each}
			</div>
		{/each}
		<InfiniteScroll {hasMore} on:loadMore={loadMore} />
	{:else}
		<p class="text-center text-lg">No upcoming competitions found for the current month.</p>
	{/if}
</div>

