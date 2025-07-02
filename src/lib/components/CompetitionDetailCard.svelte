<script>
    export let competition;

    $: defaultStartDate =  new Date(competition.startDate);
    $: defaultEndDate = new Date(competition.endDate);

    $: monthNumber = defaultStartDate.getDate(); // getMonth() is 0-indexed
    $: monthAbbreviation = defaultStartDate.toLocaleString('default', { month: 'short' });
    $: year = defaultStartDate.getFullYear();
</script>

<a href="competitions/competition_details/{competition.id}">
<div class="card">
    <div>
        <div class="flex">
            <div class="px-2 m-1 grow">
                <h2 class="text-lg">{competition.name}</h2>
                <p class="text-sm">{competition.location}</p>
            </div>
            <div class="text-center image-container">
            </div>
            <div class="text-center date-display">
                <div class="px-2 m-1">
                    <p class="month-number">{monthNumber}</p>
                    <p class="month-year">{monthAbbreviation}</p>
                    <p class="month-year">{year}</p>
                </div>
            </div>
        </div>
    </div>
    <hr class="opacity-50" />
    <div class="snap-x snap-mandatory scroll-smooth flex overflow-x-auto" >
        <!-- we list here all the categories that the competition holds -->
        {#each competition.categories as category}
        <div class="">
            <div class="flex items-center">
                <span class="chip preset-filled-surface-500 m-2">{category.type}</span>
            </div>
        </div>
        {/each}
    </div>
</div>
</a>

<style>
    .vertLine {
        border-right:20px #ff0000;    /* line 1 pixel width, length of "Some content" */
    }

    .category-times {
        display: flex;
        gap: 1rem; /* Adjust the gap as needed */
    }

    .date-display {
        display: flex;
        align-items: center;
    }
    .month-number {
      font-size: 2rem; /* Larger font size for the month number */
      line-height: 1;
    }
    .month-year {
      font-size: 1rem; /* Smaller font size for the month abbreviation and year */
      line-height: 1;
    }
    .image-container {
        display: flex;
        align-items: center;
        justify-content: center;
        max-width: 2.5rem; /* Adjust as needed */
        overflow: hidden;
    }
</style>
