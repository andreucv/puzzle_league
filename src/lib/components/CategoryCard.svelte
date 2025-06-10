<script>
    export let category;
    export let show_date;

    const defaultStartDate =  new Date(category.date);
    const monthNumber = defaultStartDate.getDate();
    const monthAbbreviation = defaultStartDate.toLocaleString('default', { month: 'short' });

    // import { t } from '$lib/translations';

</script>

<div class="w-full lg:max-w-full lg:flex p-1 mb-2 card variant-glass-secondary">
    <div class="flex items-center justify-between px-2">
        <div class="order-first">
            <div class="flex flex-col">
                <p class="font-bold">{category.category_type}</p>
            </div>
        </div>
        <div class="order-last">
            <div class="flex items-center">
                {#if show_date === true}
                <div class="flex items-center grid cols-1 px-6 order-first">
                    <p>{monthNumber} {monthAbbreviation}</p>
                </div>
                <div class="flex items-center grid cols-1 order-2">
                    <p>{category.start_time}</p>
                    <p>{category.end_time}</p>
                </div>
                {:else}
                <div class="flex items-center grid cols-1 order-first">
                    <p>{category.start_time}</p>
                    <p>{category.end_time}</p>
                </div>
                {/if}
                <div class="flex items-center order-last ml-20">
                    <p>{category.participation_fee}€</p>
                </div>
            </div>
        </div>
    </div>
</div>