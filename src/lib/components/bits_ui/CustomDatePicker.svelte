<script lang="ts">
  import CalendarBlank from "phosphor-svelte/lib/CalendarBlank";
  import CaretLeft from "phosphor-svelte/lib/CaretLeft";
  import CaretRight from "phosphor-svelte/lib/CaretRight";
  import { DatePicker } from "bits-ui";

  let {
    labelText = "Select a date",
    value = $bindable(),
    placeholder = $bindable(),
    name,
    ...restProps
  }: DateField.RootProps & { labelText: string; name?: string } = $props();
  console.log("restProps", restProps);
</script>

<DatePicker.Root weekdayFormat="short" fixedWeeks={true} bind:value={value} {...restProps}>
  <div class="flex w-full flex-col gap-1">
    <DatePicker.Label>
        {labelText}
    </DatePicker.Label>
    <DatePicker.Input
      class="input h-input rounded-input rounded-lg bg-primary-50-950 text-foreground flex w-full select-none items-center px-2 py-1"
    >
      {#snippet children({ segments })}
        {#each segments as { part, value }, i (part + i)}
          <div class="inline-block select-none">
            {#if part === "literal"}
              <DatePicker.Segment {part} class="text-muted-foreground p-1">
                {value}
              </DatePicker.Segment>
            {:else}
              <DatePicker.Segment
                {part}
                class="rounded-5px hover:bg-muted focus:bg-muted focus:text-foreground aria-[valuetext=Empty]:text-muted-foreground focus-visible:ring-0! focus-visible:ring-offset-0! px-1 py-1"
              >
                {value}
              </DatePicker.Segment>
            {/if}
          </div>
        {/each}
        <DatePicker.Trigger
          class="text-foreground/60 hover:bg-muted active:bg-dark-10 ml-auto inline-flex size-8 items-center justify-center rounded-[5px] transition-all"
        >
          <CalendarBlank class="size-6" />
        </DatePicker.Trigger>
      {/snippet}
    </DatePicker.Input>
    <DatePicker.Content sideOffset={6} class="z-50">
      <DatePicker.Calendar
        class="border-dark-10 bg-primary-200-800 shadow-popover rounded-[15px] border p-[22px]"
      >
        {#snippet children({ months, weekdays })}
          <DatePicker.Header class="flex items-center justify-between">
            <DatePicker.PrevButton
              class="rounded-9px bg-primary-200-800 hover:bg-muted inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]"
            >
              <CaretLeft class="size-6" />
            </DatePicker.PrevButton>
            <DatePicker.Heading class="text-[15px] font-medium" />
            <DatePicker.NextButton
              class="rounded-9px bg-primary-200-800 hover:bg-muted inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]"
            >
              <CaretRight class="size-6" />
            </DatePicker.NextButton>
          </DatePicker.Header>
          <div
            class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0"
          >
            {#each months as month (month.value)}
              <DatePicker.Grid
                class="w-full border-collapse select-none space-y-1"
              >
                <DatePicker.GridHead>
                  <DatePicker.GridRow class="mb-1 flex w-full justify-between">
                    {#each weekdays as day (day)}
                      <DatePicker.HeadCell
                        class="text-muted-foreground font-normal! w-10 rounded-md text-xs"
                      >
                        <div>{day.slice(0, 2)}</div>
                      </DatePicker.HeadCell>
                    {/each}
                  </DatePicker.GridRow>
                </DatePicker.GridHead>
                <DatePicker.GridBody>
                  {#each month.weeks as weekDates (weekDates)}
                    <DatePicker.GridRow class="flex w-full">
                      {#each weekDates as date (date)}
                        <DatePicker.Cell
                          {date}
                          month={month.value}
                          class="p-0! relative size-10 text-center text-sm"
                        >
                          <DatePicker.Day
                            class="rounded text-foreground hover:border-foreground data-selected:bg-foreground data-disabled:bg-primary-900/30 data-selected:bg-primary-900 data-unavailable:bg-primary-500 data-disabled:pointer-events-none data-selected:font-medium data-unavailable:line-through group relative inline-flex size-10 items-center justify-center whitespace-nowrap border border-transparent bg-transparent p-0 text-sm font-normal transition-all"
                          >
                            <div
                              class="bg-primary-900-100 group-data-selected:bg-background group-data-today:block absolute top-[5px] hidden size-1 rounded-full transition-all"
                            ></div>
                            {date.day}
                          </DatePicker.Day>
                        </DatePicker.Cell>
                      {/each}
                    </DatePicker.GridRow>
                  {/each}
                </DatePicker.GridBody>
              </DatePicker.Grid>
            {/each}
          </div>
        {/snippet}
      </DatePicker.Calendar>
    </DatePicker.Content>
  </div>
</DatePicker.Root>
