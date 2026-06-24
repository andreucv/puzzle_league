<script lang="ts">
    import { DateRangePicker, type DateRange } from "bits-ui";
    import type { CalendarDate, DateValue } from "@internationalized/date";
    import CalendarBlank from "@iconify-svelte/mdi/calendar-blank-outline";
    import CaretLeft from "@iconify-svelte/mdi/chevron-left";
    import CaretRight from "@iconify-svelte/mdi/chevron-right";

    let {
        locale,
        name = "date",
        labelText = "Competition Days",
        value = null,
        minValue = undefined,
        required = false,
        disableDaysOutsideMonth = true,
        weekStartsOn = 1,
        pagedNavigation = true,
        onValueChange = (value: CalendarDate | undefined) => {}
    }: {
        locale?: string;
        name?: string;
        labelText?: string;
        value?: CalendarDate | null;
        minValue?: DateValue;
        required?: boolean;
        disableDaysOutsideMonth?: boolean;
        weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
        pagedNavigation?: boolean;
        onValueChange?: (value: CalendarDate | undefined) => void;
    } = $props();

    // Convert single date value to DateRange for the component
    let rangeValue = $derived(value ? { start: value, end: value } : undefined);

    function handleValueChange(newRange: DateRange | undefined) {
        // Pass the start date to the parent callback
        onValueChange(newRange?.start as CalendarDate | undefined);
    }
</script>

<DateRangePicker.Root
  weekdayFormat="short"
  fixedWeeks={true}
  locale={locale}
  value={rangeValue}
  onValueChange={handleValueChange}
  minValue={minValue}
  {weekStartsOn}
  {pagedNavigation}
  disableDaysOutsideMonth={disableDaysOutsideMonth}
  class="flex w-full max-w-[340px] flex-col gap-1.5"
>
  <DateRangePicker.Label class="block select-none text-sm font-medium"
    >{labelText}</DateRangePicker.Label
  >
  <div
    class="h-input rounded-input bg-background text-foreground focus-within:border-border-input-hover focus-within:shadow-date-field-focus hover:border-border-input-hover flex w-full select-none items-center border-2 border-primary-300 rounded-[10px] px-2 py-3 text-sm tracking-[0.01em]"
  >
    {#each ["start", "end"] as const as type (type)}
      <DateRangePicker.Input {type}>
        {#snippet children({ segments })}
          {#each segments as { part, value }, i (part + i)}
            <div class="inline-block select-none">
              {#if part === "literal"}
                <DateRangePicker.Segment
                  {part}
                  class="text-muted-foreground p-1"
                >
                  {value}
                </DateRangePicker.Segment>
              {:else}
                <DateRangePicker.Segment
                  {part}
                  class="rounded-5px hover:bg-muted focus:bg-muted focus:text-foreground aria-[valuetext=Empty]:text-muted-foreground focus-visible:ring-0! focus-visible:ring-offset-0! px-1 py-1"
                >
                  {value}
                </DateRangePicker.Segment>
              {/if}
            </div>
          {/each}
        {/snippet}
      </DateRangePicker.Input>
      {#if type === "start"}
        <div aria-hidden="true" class="text-muted-foreground px-1">–⁠⁠⁠⁠⁠</div>
      {/if}
    {/each}

    <DateRangePicker.Trigger
      class="text-foreground/60 hover:bg-muted active:bg-dark-10 ml-auto inline-flex size-8 items-center justify-center rounded-[5px] transition-all"
    >
      <CalendarBlank class="size-6" />
    </DateRangePicker.Trigger>
  </div>
  <DateRangePicker.Content sideOffset={6} class="z-50">
    <DateRangePicker.Calendar
      class="rounded-15px border-dark-10 bg-background-alt bg-primary-50-950 shadow-popover mt-6 border-2 border-primary-300 rounded-[10px] p-[22px]"
    >
      {#snippet children({ months, weekdays })}
        <DateRangePicker.Header class="flex items-center justify-between">
          <DateRangePicker.PrevButton
            class="rounded-9px bg-background-alt hover:bg-muted inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]"
          >
            <CaretLeft class="size-6" />
          </DateRangePicker.PrevButton>
          <DateRangePicker.Heading class="text-[15px] font-medium" />
          <DateRangePicker.NextButton
            class="rounded-9px bg-background-alt hover:bg-muted inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]"
          >
            <CaretRight class="size-6" />
          </DateRangePicker.NextButton>
        </DateRangePicker.Header>
        <div
          class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0"
        >
          {#each months as month (month.value)}
            <DateRangePicker.Grid
              class="w-full border-collapse select-none space-y-1"
            >
              <DateRangePicker.GridHead>
                <DateRangePicker.GridRow
                  class="mb-1 flex w-full justify-between"
                >
                  {#each weekdays as day (day)}
                    <DateRangePicker.HeadCell
                      class="text-muted-foreground font-normal! w-10 rounded-md text-xs"
                    >
                      <div>{day.slice(0, 2)}</div>
                    </DateRangePicker.HeadCell>
                  {/each}
                </DateRangePicker.GridRow>
              </DateRangePicker.GridHead>
              <DateRangePicker.GridBody>
                {#each month.weeks as weekDates (weekDates)}
                  <DateRangePicker.GridRow class="flex w-full">
                    {#each weekDates as date (date)}
                      <DateRangePicker.Cell
                        {date}
                        month={month.value}
                        class="p-0! relative m-0 size-10 overflow-visible text-center text-sm focus-within:relative focus-within:z-20"
                      >
                        <DateRangePicker.Day
                          class="rounded-9px text-foreground hover:border-foreground focus-visible:ring-foreground! data-selection-end:rounded-9px data-selection-start:rounded-9px data-highlighted:bg-muted data-selected:bg-muted data-selection-end:bg-foreground data-selection-start:bg-foreground data-disabled:text-gray-400 data-disabled:bg-gray-100 dark:data-disabled:text-gray-600 dark:data-disabled:bg-gray-800/50 data-selected:text-foreground data-selection-end:text-background data-selection-start:text-background data-unavailable:text-muted-foreground data-selected:[&:not([data-selection-start])]:[&:not([data-selection-end])]:focus-visible:border-foreground data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-highlighted:rounded-none data-outside-month:text-gray-400 dark:data-outside-month:text-gray-500 data-selected:font-medium data-selection-end:font-medium data-selection-start:font-medium data-selection-start:focus-visible:ring-2 data-selection-start:focus-visible:ring-offset-2! data-unavailable:line-through data-selected:[&:not([data-selection-start])]:[&:not([data-selection-end])]:rounded-none data-selected:[&:not([data-selection-start])]:[&:not([data-selection-end])]:focus-visible:ring-0! data-selected:[&:not([data-selection-start])]:[&:not([data-selection-end])]:focus-visible:ring-offset-0! group relative inline-flex size-10 items-center justify-center overflow-visible whitespace-nowrap border border-transparent bg-transparent p-0 text-sm font-normal transition-all"
                        >
                          <div
                            class="bg-foreground group-data-selected:bg-background group-data-today:block absolute top-[5px] hidden size-1 rounded-full transition-all"
                          ></div>
                          {date.day}
                        </DateRangePicker.Day>
                      </DateRangePicker.Cell>
                    {/each}
                  </DateRangePicker.GridRow>
                {/each}
              </DateRangePicker.GridBody>
            </DateRangePicker.Grid>
          {/each}
        </div>
      {/snippet}
    </DateRangePicker.Calendar>
  </DateRangePicker.Content>
</DateRangePicker.Root>
