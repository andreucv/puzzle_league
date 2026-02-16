<script lang="ts">
    import Icon from '@iconify/svelte';

    let { title, subtitle, icon, href} = $props();
</script>

<a href={href}>
    <div class="card preset-filled-200-800 w-full card-hover shadow-lg">
        <div class="flex items-center gap-4 p-4">
            <div class="w-8 h-8 flex-shrink-0">
                <Icon icon={icon} class="w-8 h-8"></Icon>
            </div>
            <div class="">
                <h3 class="font-semibold">{title}</h3>
                <p class="text-sm opacity-75">{subtitle}</p>
            </div>
        </div>
    </div>
</a>
