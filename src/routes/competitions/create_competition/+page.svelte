<script lang="ts">
    import { FileDropzone, SlideToggle } from '@skeletonlabs/skeleton';

    let bool_same_day = true;
    let competition = {
        name: '',
        location: '',
        start_date: '',
        end_date: '',
        image: null,
    };
    let categories = [];
    let competitionImage = null;
    let files : FileList;

    function handleImageChange(event) {
        const file = event.target.files[0];
        competitionImage = URL.createObjectURL(file);
    }

    function handleAddCategory() {
        categories = [...categories, {
            category_type: '',
            date: '',
            start_time: '',
            end_time: '',
            participation_fee: 0
        }];
        console.log(categories)
    }

    function handleRemoveCategory(category) {
        categories = categories.filter(c => c !== category);
    }
</script>


<div class="">
    <h1>Create competition</h1>
    <form method="post" action="?/create_competition" enctype="multipart/form-data">
        <input type="text" id="competition_name" name="competition_name" class="data-input text-black" placeholder="Competition Name"/>
        <input type="text" id="location" name="location" class="data-input text-black" placeholder="Location"/>
        <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
            <div class="mt-1">
                <label for="start_date">Start Date</label>
                <input type="date" id="start_date" name="start_date" class="data-input text-black" />
            </div>
            {#if bool_same_day === true}
                <div class="mt-1">
                    <label for="bool_end_day_button">End Date</label>
                    <a class="data-input text-center bg-blue-500" id="bool_end_day_button" on:click={() => bool_same_day = !bool_same_day}>Add end day?</a>
                </div>
            {:else}
                <div class="mt-1">
                    <label for="end_date">End Date</label>
                    <input type="date" id="end_date" name="end_date" class="data-input" />
                </div>
            {/if}
        </div>
        <div class="mt-1">
            <label>Competition Image</label>
            <FileDropzone accept="image/*" id="competition_image" name="competition_image" bind:files={files} on:change={handleImageChange}>
                <svelte:fragment slot="message">
                <img src={competitionImage} alt="Competition Image" class="rounded-l {competitionImage !== null ? 'h-20' : ''}" />
                </svelte:fragment>
            </FileDropzone>
        </div>
        <hr class="my-4" />
        <div class="flex justify-between">
            <a on:click={handleAddCategory} class="bg-indigo-500 text-white px-2 rounded">Add Category</a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
            {#each categories as category}
            <div class="w-full lg:max-w-full lg:flex bg-indigo-700 p-1 rounded shadow" style="position: relative;">
                <a on:click={() => handleRemoveCategory(category)} style="position: absolute; right: 0.25rem; top: 0.25rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </a>
                <h3 class="pt-1 px-1">Category</h3>
                <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 px-1 mt-2">
                    <input type="text" id="category_type" name="category_type" bind:value={category.category_type} class="data-input" placeholder="Category Type" />
                    {#if bool_same_day == false}
                        <input type="date" id="date" name="date" bind:value={category.date} class="data-input" placeholder="Category date"/>
                    {/if}
                </div>
                <!-- <div class="flex inline-block pl-1 pr-1 grid grid-cols-2">
                    <SlideToggle name="slider-label" bind:checked={category.is_marathon}>Is Marathon?</SlideToggle>
                    <div>
                        {#if !category.is_marathon}
                        <label for="puzzle_npieces">Puzzle Pieces</label>
                        <input type="number" id="puzzle_npieces" name="puzzle_npieces" bind:value={category.pieces} class="data-input" />
                        {/if}
                    </div>
                </div> -->
                <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 px-1">
                    <div class="mt-1">
                        <label for="start_time">Start Time</label>
                        <input type="time" id="start_time" name="start_time" class="data-input text-black" bind:value={category.start_time}/>
                    </div>
                    <div class="mt-1">
                        <label for="end_time">End Time</label>
                        <input type="time" id="end_time" name="end_time" class="data-input" bind:value={category.end_time}/>
                    </div>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 px-1">
                    <div class="mt-1">
                        <label for="participation_fee">Participation Fee</label>
                        <input type="number" id="participation_fee" name="participation_fee" class="data-input text-black" bind:value={category.participation_fee} />
                    </div>
                </div>
            </div>
            {/each}
        </div>
        <input type="hidden" name="categories" value={JSON.stringify(categories)} />
        <button type="submit" class="submit-button {categories.length > 0 ? 'bg-indigo-500' : 'bg-gray-500'}" disabled={categories.length === 0}>Submit</button>
    </form>
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
</style>
