<script lang="ts">
    let { title, subtitle, icon: Icon, href, ...restProps}: {
        title: string;
        subtitle: string;
        icon: any;
        href: string;
        [key: string]: any;
    } = $props();
</script>

<a href={href} {...restProps}>
    <div class="card preset-filled-200-800 w-full card-hover shadow-lg">
        <div class="flex items-center gap-4 p-4">
            <div class="w-8 h-8 flex-shrink-0">
                <Icon class="w-8 h-8" />
            </div>
            <div class="">
                <h3 class="font-semibold">{title}</h3>
                <p class="text-sm opacity-75">{subtitle}</p>
            </div>
        </div>
    </div>
</a>
