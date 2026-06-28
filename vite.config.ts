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
	test: {
		// Clear mock call history between every test so suites don't have to remember a
		// per-file vi.clearAllMocks(). Deliberately NOT mockReset/restoreMocks: those wipe the
		// mock implementations (e.g. the mockResolvedValue defaults in src/tests/mocks/*), which
		// several suites rely on.
		clearMocks: true,
		// Environment split by filename convention (SvelteKit-official):
		//   *.svelte.test.ts  -> client project (jsdom + browser resolve conditions)
		//   *.test.ts (rest)  -> server project (node; no browser conditions)
		// Browser conditions are scoped to the client project ONLY — applying them
		// globally made server suites resolve the *browser* build of dependencies.
		projects: [
			{
				extends: true,
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.test.ts'],
					exclude: ['src/**/*.svelte.test.ts'],
					setupFiles: ['src/tests/setup.server.ts'],
				},
			},
			{
				extends: true,
				resolve: { conditions: ['browser'] },
				test: {
					name: 'client',
					environment: 'jsdom',
					include: ['src/**/*.svelte.test.ts'],
					setupFiles: ['src/tests/setup.client.ts'],
				},
			},
		],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			include: ['src/**'],
			exclude: [
				'src/**/*.test.ts',
				'src/tests/**',
				'src/**/*.svelte', // markup-only; the unit layer asserts behaviour, not template lines
				'src/**/*.d.ts',
				'src/lib/.prisma/**', // generated Prisma client
				'src/app.d.ts',
				'src/app.html', // HTML shell, not parseable as JS
				'**/.DS_Store', // macOS cruft caught by the src/** glob
			],
			// Regression-only floor: thresholds are pinned a couple points below the current
			// measured numbers (Stmts 21.01 / Branch 22.96 / Funcs 19.2 / Lines 21.47 on
			// 2026-06-15) so CI fails on a drop, not on a missing aspiration. Ratchet upward later.
			thresholds: {
				lines: 20,
				functions: 18,
				statements: 20,
				branches: 21,
			},
		},
		alias: {
			'$app/navigation': '/src/tests/mocks/app_navigation.ts',
			'$app/environment': '/src/tests/mocks/app_environment.ts',
			'$app/stores': '/src/tests/mocks/app_stores.ts',
			$tests: '/src/tests',
		},
	},
    // To enable hot module reloading, we need to enable polling because of docker environment
	server: {
		watch: {
			usePolling: true,
		},
		fs: {
			allow: ['prisma/generated'] // Allow access to parent directory for better-auth and prisma client
		},
		warmup: {
			ssrFiles: ['./src/hooks.server.ts']
		}
	}
});
