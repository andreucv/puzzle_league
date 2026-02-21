<script lang="ts">
    import type { User , Category, Entry, Prisma} from '@prisma/client';

    import Icon from '@iconify/svelte';
    let { category, entry, currentUser }: { category: Category, entry: Prisma.EntryUpdateWithoutCategoryInput , currentUser: User } = $props();
    // data will include:
    // - category_id, category_type, max_party_size
    // - binded map to return as: mao {category_id: [user_id, user_id, ...]}
    // - number of users in map will depend on max_party_size of category

    /**
     * @param {Object} category
     * @param {string} user_id
     *
     * @returns {map<number, Array<User>>} map
     *
     * This component will be used by the users to choose their party members
     * when signing up for a category in a competition.
     *
    */

</script>

<div class="container">
    <div class="p-3 bg-success-50 border border-success-200 rounded-lg">
        <div class="flex items-center justify-between mb-2">
            <div class="badge preset-filled-success-500">
                Registered
            </div>
            <form method="POST" action="?/remove_entry" class="inline">
                <input type="hidden" name="category_id" value={category.id} />
                <input type="hidden" name="user_id" value={currentUser.id} />
                <button
                    type="submit"
                    class="btn btn-sm preset-filled-error-500 hover:preset-filled-error-600 transition-colors"
                >
                    <Icon icon="mdi:close" width="1rem" height="1rem" />
                    Remove
                </button>
            </form>
        </div>
        <div class="space-y-2">
            <div class="text-xs text-success-700 mb-1">Team Members:</div>
            <div class="flex flex-wrap gap-2">
                {#each entry.users as user}
                    <div class="flex items-center gap-2 badge preset-filled-primary-500 text-xs">
                        <span>{user.name}</span>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>
