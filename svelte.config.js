import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: [ vitePreprocess() ],

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter({
            runtime: 'nodejs20.x',
        }),
		// Required for PostHog session replay to work correctly with SSR
		paths: {
			relative: false
		},
		// Test-only alias so suites import shared mocks/factories as `$tests/...`
		// instead of fragile `../../../tests/...` relative paths. svelte-kit sync
		// propagates this into .svelte-kit/tsconfig.json so `pnpm check` resolves it.
		alias: {
			$tests: 'src/tests'
		}
	},
};

export default config;
