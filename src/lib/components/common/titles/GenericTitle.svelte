<script lang="ts">
    let { text, testId = undefined } = $props();
</script>

<div class="flex items-center gap-2 mb-2">
    <h4 class="h4 font-sans font-medium" data-testid={testId}>{text}</h4>
</div>
