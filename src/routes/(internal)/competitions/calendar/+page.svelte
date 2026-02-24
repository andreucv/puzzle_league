<script lang="ts">
	import CompetitionCard from '$lib/components/competition/CompetitionCard.svelte';
	import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
	import { t } from '$lib/translations';
	import type { PageData } from './$types';
	export let data: PageData;
	let competitions = data.competitions;
	let currentDate = new Date();
	function getMonthName(month: number) { return new Date(2000, month, 1).toLocaleString('default', { month: 'long' }); }
	// Build flat array of 42 cells (6 weeks * 7 days) Monday-first containing objects with meta info.
	let days: { date: Date; inCurrent: boolean; comps: PageData['competitions'] }[] = [];
	function buildDays() {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		const first = new Date(year, month, 1);
		const mondayIndex = (first.getDay() + 6) % 7; // Monday=0
		const start = new Date(first);
		start.setDate(first.getDate() - mondayIndex);
		const arr: typeof days = [];
		for (let i = 0; i < 42; i++) {
			const d = new Date(start);
			d.setDate(start.getDate() + i);
			const comps = competitions.filter(c => {
				const sd = new Date(c.startDate);
				return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth() && sd.getDate() === d.getDate();
			});
			arr.push({ date: d, inCurrent: d.getMonth() === month, comps });
		}
		days = arr;
	}
	buildDays();
	$: currentDate, buildDays();
	$: competitions, buildDays();
	function groupCompetitionsByDate(list: PageData['competitions']) {
		return list.reduce((groups, competition) => {
			const date = new Date(competition.startDate).toDateString();
			(groups[date] ||= []).push(competition);
			return groups;
		}, {} as Record<string, PageData['competitions']>);
	}
	$: groupedCompetitions = groupCompetitionsByDate([...competitions].sort((a,b)=> new Date(a.startDate).getTime() - new Date(b.startDate).getTime()));
	async function fetchCompetitions(month: number, year: number) {
		const res = await fetch(`/api/competitions/bymonth/${month}/${year}`);
		competitions = res.ok ? await res.json() : [];
	}
	function prevMonth() { currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1); fetchCompetitions(currentDate.getMonth(), currentDate.getFullYear()); }
	function nextMonth() { currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1); fetchCompetitions(currentDate.getMonth(), currentDate.getFullYear()); }
</script>

<svelte:head><title>{$t('competitions.calendar')}</title></svelte:head>

<div class="p-4 max-w-4xl mx-auto">
	<div class="flex justify-between items-center mb-4">
		<button class="btn variant-filled-primary" on:click={prevMonth} aria-label="Previous month">{'<'}</button>
		<p class="h1">{getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}</p>
		<button class="btn variant-filled-primary" on:click={nextMonth} aria-label="Next month">{'>'}</button>
	</div>
	<div class="grid grid-cols-7 text-center text-xs font-semibold mb-1 select-none">
		{#each ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] as wd}<div class="py-1">{wd}</div>{/each}
	</div>
	<!-- Day cells -->
	<div class="grid grid-cols-7 gap-1">
		{#each days as cell (cell.date.toDateString())}
			<div class="relative aspect-square rounded-md border p-1 text-[13px] flex flex-col items-start overflow-hidden
				{cell.inCurrent ? 'bg-surface-100-800-token' : 'bg-surface-50-900-token text-gray-400'}">
				<span class="font-medium leading-none">{cell.date.getDate()}</span>
				{#if cell.comps.length}
					<div class="mt-auto w-full flex flex-wrap gap-0.5">
						{#each cell.comps.slice(0,3) as c}
							<span class="w-2 h-2 rounded-full bg-primary-500" title={c.name}></span>
						{/each}
						{#if cell.comps.length > 3}
							<span class="text-[10px] font-bold">+{cell.comps.length - 3}</span>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<div class="container mx-auto p-4">
	<GenericTitle text={$t('competitions.upcoming_competitions')} />
	{#if Object.keys(groupedCompetitions).length}
		{#each Object.entries(groupedCompetitions) as [date, comps]}
			<h5 class="h5 my-2">{new Date(date).toLocaleDateString(undefined,{ weekday:'long',year:'numeric',month:'long',day:'numeric'})}</h5>
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each comps as competition (competition.id)}<CompetitionCard {competition} noShowCategories={true} />{/each}
			</div>
		{/each}
	{:else}
		<p class="text-center text-lg">No upcoming competitions found for the selected month.</p>
	{/if}
</div>
