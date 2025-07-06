<script lang="ts">
  import Icon from '@iconify/svelte';

  let checked = $state(false);

  $effect(() => {
    const mode = localStorage.getItem('mode') || 'light';
    checked = mode === 'dark';
  });

  const onCheckedChange = (event: { checked: boolean }) => {
    const mode = event.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-mode', mode);
    localStorage.setItem('mode', mode);
    checked = event.checked;
  };
</script>

<svelte:head>
  <script>
    const mode = localStorage.getItem('mode') || 'light';
    document.documentElement.setAttribute('data-mode', mode);
  </script>
</svelte:head>

<button class="btn" onclick={() => onCheckedChange({ checked: !checked })}>
  <Icon icon="mdi:theme-light-dark" width="1.5rem" height="1.5rem" />
</button>
