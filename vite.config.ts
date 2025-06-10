import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		enhancedImages(),
		sveltekit()
	],
    // To enable hot module reloading, we need to enable polling because of docker environment
	server: {
		watch: {
			usePolling: true,
		}
	}
});
