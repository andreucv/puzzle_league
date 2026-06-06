<script lang="ts">
	import CompetitionItem from '$lib/components/competition/CompetitionItem.svelte';
	import InfiniteScroll from '$lib/components/common/InfiniteScroll.svelte';
	import { t } from '$lib/translations';
	import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
	import type { Competition } from '$lib/.prisma/generated/prisma/browser';
	import { getStartOfWeek, addDays } from '$lib/utils/date_utils';

	let { data } = $props();
	// svelte-ignore state_referenced_locally
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
				competitions = [...competitions, ...newCompetitions];
				page++;
			} else {
				hasMore = false;
			}
		} else {
			hasMore = false;
		}
	}

	type WeekData = {
		weekdays: Competition[];
		saturday: Competition[];
		sunday: Competition[];
		weekdaysDateRange: string;
		saturdayDate: Date | null;
		sundayDate: Date | null;
	};

	type MonthData = {
		monthName: string;
		weeks: Record<string, WeekData>;
	};

	function groupCompetitionsForTable(competitions: Competition[]): Record<string, MonthData> {
		const months: Record<string, MonthData> = {};

		const sortedCompetitions = [...competitions].sort(
			(a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
		);

		for (const competition of sortedCompetitions) {
			const compDate = new Date(competition.startDate);
			const year = compDate.getFullYear();
			const month = compDate.getMonth();
			const monthKey = `${year}-${month}`;

			if (!months[monthKey]) {
				months[monthKey] = {
					monthName: compDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
					weeks: {}
				};
			}

			const weekStart = getStartOfWeek(compDate);
			const weekKey = weekStart.toISOString().split('T')[0];

			if (!months[monthKey].weeks[weekKey]) {
				const saturday = addDays(weekStart, 5);
				const sunday = addDays(weekStart, 6);

				months[monthKey].weeks[weekKey] = {
					weekdays: [],
					saturday: [],
					sunday: [],
					weekdaysDateRange: `${weekStart.getDate()} - ${addDays(weekStart, 4).getDate()}`,
					saturdayDate: saturday.getMonth() === month ? saturday : null,
					sundayDate: sunday.getMonth() === month ? sunday : null
				};
			}

			const day = compDate.getDay(); // Sunday: 0, Monday: 1, ..., Saturday: 6
			if (day >= 1 && day <= 5) {
				months[monthKey].weeks[weekKey].weekdays.push(competition);
			} else if (day === 6) {
				months[monthKey].weeks[weekKey].saturday.push(competition);
			} else if (day === 0) {
				months[monthKey].weeks[weekKey].sunday.push(competition);
			}
		}
		return months;
	}

	let groupedCompetitions = $derived(groupCompetitionsForTable(competitions));
</script>

<svelte:head>
	<title>{$t('competitions.calendar')}</title>
</svelte:head>

<GenericTitle text={$t('competitions.calendar')} />

<div class="container mx-auto">
	{#if competitions.length > 0}
		{#each Object.values(groupedCompetitions) as monthData (monthData.monthName)}
			<h3 class="h3 my-6 text-center">{monthData.monthName}</h3>
			<div class="table-container">
				<table class="table table-auto w-full">
					<thead>
						<tr>
							<th class="w-1/2 text-left">{$t('competitions.calendar_view.monday_friday')}</th>
							<th class="w-1/4 text-left">{$t('competitions.calendar_view.saturday')}</th>
							<th class="w-1/4 text-left">{$t('competitions.calendar_view.sunday')}</th>
						</tr>
					</thead>
					<tbody>
						{#each Object.values(monthData.weeks) as week}
							<tr>
								<td class="align-top p-2 border">
									<div class="font-bold text-sm mb-2">{week.weekdaysDateRange}</div>
									{#each week.weekdays as comp (comp.id)}
										<CompetitionItem competition={comp} />
									{/each}
								</td>
								<td class="align-top p-2 border">
									{#if week.saturdayDate}
										<div class="font-bold text-sm mb-2">{week.saturdayDate.getDate()}</div>
									{/if}
									{#each week.saturday as comp (comp.id)}
										<CompetitionItem competition={comp} />
									{/each}
								</td>
								<td class="align-top p-2 border">
									{#if week.sundayDate}
										<div class="font-bold text-sm mb-2">{week.sundayDate.getDate()}</div>
									{/if}
									{#each week.sunday as comp (comp.id)}
										<CompetitionItem competition={comp} />
									{/each}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/each}
		<InfiniteScroll {hasMore} on:loadMore={loadMore} />
	{:else}
		<p class="text-center text-lg">{$t('competitions.no_upcoming_competitions')}</p>
	{/if}
</div>
