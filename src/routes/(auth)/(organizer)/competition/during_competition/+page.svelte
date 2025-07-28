<script>
  import Avatar from '$lib/components/Avatar.svelte';

  // Hardcoded data for now
  let competition = { name: "Summer Puzzle League", role: "Organizer" };
  let judges = ["Alice", "Bob", "Carlos", "Diana"];
  let categories = [
    { id: 1, name: "1000 Piece", scheduled: "10:00", status: "not_started" },
    { id: 2, name: "500 Piece", scheduled: "11:00", status: "in_progress", realStart: "11:05", realEnd: null }
  ];
  let entries = [
    { id: 1, name: "Team Alpha", tableNumber: 1, finish: null },
    { id: 2, name: "Team Beta", tableNumber: 2, finish: "00:45:23" },
    { id: 3, name: "Team Gamma", tableNumber: 3, finish: null },
    { id: 4, name: "Team Delta", tableNumber: 4, finish: "00:52:15" }
  ];
</script>

<header class="p-2 flex justify-between items-center bg-gray-100">
  <h1 class="text-xl font-bold">{competition.name}</h1>
  <span class="text-sm">Role: {competition.role}</span>
  <span class="text-sm">{new Date().toLocaleTimeString()}</span>
</header>

<section class="p-2">
  <h2 class="font-semibold mb-2">Assigned Judges</h2>
  <div class="flex items-center gap-4 mb-2">
    {#each judges as judge}
      <div class="flex flex-col items-center">
        <Avatar user={{ name: judge }} size={6} />
        <span class="text-xs mt-1">{judge}</span>
      </div>
    {/each}
    <button class="btn btn-primary ml-4">Add Judge</button>
  </div>
</section>

<section class="p-2">
  <h2 class="font-semibold mb-2">Categories About to Start</h2>
  {#each categories.filter(c => c.status === "not_started") as cat}
    <div class="card mb-2 p-2 flex justify-between items-center">
      <div>
        <div class="font-bold">{cat.name}</div>
        <div class="text-sm">Scheduled: {cat.scheduled}</div>
      </div>
      <button class="btn btn-success">Start</button>
    </div>
  {/each}
</section>

<section class="p-2">
  <h2 class="font-semibold mb-2">Categories In Progress</h2>
  {#each categories.filter(c => c.status === "in_progress") as cat}
    <div class="card mb-2 p-2">
      <div class="flex justify-between items-center">
        <div>
          <div class="font-bold">{cat.name}</div>
          <div class="text-sm">Started: {cat.realStart}</div>
        </div>
        <button class="btn btn-danger">Stop</button>
      </div>
      <div class="mt-2">
        <h3 class="font-medium mb-2">Entries List (sortable by time, table number, name)</h3>
        <div class="overflow-x-auto">
          <table class="table-auto w-full text-sm">
            <thead>
              <tr class="bg-gray-50">
                <th class="px-2 py-1 text-left">#</th>
                <th class="px-2 py-1 text-left">Name</th>
                <th class="px-2 py-1 text-left">Finish Time</th>
                <th class="px-2 py-1 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {#each entries as entry}
                <tr class="border-b">
                  <td class="px-2 py-1">{entry.tableNumber}</td>
                  <td class="px-2 py-1">{entry.name}</td>
                  <td class="px-2 py-1">
                    {#if entry.finish}
                      <span class="text-green-600">{entry.finish}</span>
                    {:else}
                      <span class="text-gray-400">-</span>
                    {/if}
                  </td>
                  <td class="px-2 py-1">
                    {#if !entry.finish}
                      <button class="btn btn-sm btn-secondary">Record Result</button>
                    {:else}
                      <span class="text-green-600 text-xs">Completed</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/each}
</section>

<section class="p-4">
  <h2 class="font-semibold mb-2">Quick Entry</h2>
  <div class="flex gap-4">
    <button class="btn btn-accent">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      Scan QR Code
    </button>
    <button class="btn btn-secondary">Manual Entry</button>
  </div>
</section>
