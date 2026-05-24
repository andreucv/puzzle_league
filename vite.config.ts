import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig } from 'vitest/config';
import tailwindcss from "@tailwindcss/vite";
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version)
	},
	plugins: [
		enhancedImages(),
		tailwindcss(),
		sveltekit()
	],
	resolve: process.env.VITEST
		? { conditions: ['browser'] }
		: undefined,
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'jsdom',
		setupFiles: ['src/tests/setup.ts'],
		alias: {
			'$app/navigation': '/src/tests/mocks/app_navigation.ts',
			'$app/environment': '/src/tests/mocks/app_environment.ts',
			'$app/stores': '/src/tests/mocks/app_stores.ts',
		},
	},
    // To enable hot module reloading, we need to enable polling because of docker environment
	server: {
		watch: {
			usePolling: true,
		},
		fs: {
			allow: ['prisma/generated'] // Allow access to parent directory for better-auth and prisma client
		}
	}
});
