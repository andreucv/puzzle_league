<script lang="ts">
    import CategoryCard from '$lib/components/CategoryCard.svelte';
    // import { CldImage } from 'svelte-cloudinary';

    import Icon from '@iconify/svelte';
    //import map from '$lib/images/map.png';
    // import { Modal, getModalStore } from '@skeletonlabs/skeleton';
    // import { t } from '$lib/translations';

    // const modalStore = getModalStore();

    let { data } = $props();

    const competitionName         = data.props.competition_and_categories?.name;
    const competitionLocation     = data.props.competition_and_categories?.location;
    const competition_startDate   = new Date(data.props.competition_and_categories?.start_date);
    const competition_endDate     = new Date(data.props.competition_and_categories?.end_date);
    console.log(competition_startDate, competition_endDate);
    const bool_more_than_one_day = competition_startDate !== undefined &&
                                 competition_endDate !== undefined &&
                                 String(competition_startDate) !== String(competition_endDate);

    const categories = data.props.competition_and_categories.categories;

    const monthNumber = competition_startDate.getDate();
    const monthAbbreviation = competition_startDate.toLocaleString('default', { month: 'short' });
    const year = competition_startDate.getFullYear();

    // function onDestroy() {
    //     modalStore.clear();
    // }

    // const modal: ModalSettings = {
    //     type: 'alert',
    //     // Data
    //     href:"#",
    //     title: 'Image',
    //     image: data.props.image_url,
    // };

    // function openModal() {
    //     modalStore.trigger(modal);
    // }
</script>

<svelte:head>
    <title>Competition Details</title>
</svelte:head>

<div class="p-4 relative">
    <div class="flex">
        <div class="">
            <h1 class="text-3xl">{competitionName}</h1>
            <!-- {#if data.props.user_id === data.props.competition_and_categories.created_by}
                <a href="/create_competition_categories" class="bg-gray-500 text-white px-2 py-2 rounded-full flex justify-center items-center absolute top-4 right-4">
                    <Icon icon="ic:baseline-edit" class="text-white" />
                </a>
            {/if} -->
        </div>
    </div>
    <div>
        <!-- {#if bool_more_than_one_day}
            <p class="text-lg">Competition Starts</p>
            <p class="text-lg">{competition_startDate}</p>
            <p class="text-lg">Competition Ends</p>
            <p class="text-lg">{competition_endDate}</p>
        {:else} -->
            <div class="w-full p-2 mt-1">
                <div class="flex items-center">
                    <Icon icon="mdi:clock-outline" width="2rem" height="2rem" />
                    <p class="text-xl date-format px-1">{monthNumber} {monthAbbreviation} {year}</p>
                    {#if bool_more_than_one_day}
                        <p class="text-xl date-format px-1"> - </p>
                        <p class="text-xl date-format px-1">{competition_endDate.getDate()} {competition_endDate.toLocaleString('default', { month: 'short' })} {competition_endDate.getFullYear()}</p>
                    {/if}
                </div>
                <div class="flex items-center">
                    <Icon icon="mdi:map-marker" width="2rem" height="2rem" />
                    <p class="text-xl">{competitionLocation.full_address}</p>
                </div>
            </div>
        <!-- {/if} -->
    </div>
    <div class="snap-x snap-mandatory scroll-smooth flex gap-4 overflow-x-auto mt-2" style="scrollbar-width: none; -ms-overflow-style: none;">
        <!-- google maps miniature first -->
        <!-- images after (image of competition first) -->
        <!-- <div class="h-40 w-auto flex-none" on:click={openModal}>
            <CldImage src={data.props.competition_and_categories?.image} class="h-full w-auto" />
        </div> -->
        <!-- <div class="h-40 w-auto flex-none">
            <img src={map} alt="map" class="h-full w-auto object-contain"/>
        </div> -->
    </div>
    <h1 class="text-xl font-bold mt-4">Categories</h1>
    <div class="mt-2">
        {#each categories as category}
            <CategoryCard category={category} show_date={bool_more_than_one_day}/>
        {/each}
    </div>
    <!-- <div class="flex justify-between">
        <a href="/signup_for_competition/{data.props.competition_and_categories.id}" class="submit-button bg-indigo-500 text-white px-2 rounded">Sign Up for Competition</a>
    </div> -->
</div>

<style>
.data-input {
    display: block;
    width: 100%;
    padding: 0.5rem;
    margin: 0.25rem 0;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
    color: black;
}

.submit-button {
    width: 100%;
    display: block;
    color: white;
    font-weight: bold;
    border-radius: 0.25rem;
    padding: 0.5rem;
    margin-top: 1rem;
}

.date-circle {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background-color: white;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

.date-format {
    line-height: 1;
    margin: 0;
}
</style>