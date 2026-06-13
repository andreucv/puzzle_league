import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig } from 'vitest/config';
import tailwindcss from "@tailwindcss/vite";
import { execSync } from 'node:child_process';
import pkg from './package.json' with { type: 'json' };

// Preview build counter: number of commits since the last release tag (the tags
// release-please creates). Shown on the test/preview header as v{version}-b{N} so
// QA gets a number that bumps on every commit. Best-effort and fully guarded — a
// missing .git, a shallow clone, or absent tags can never break the build.
// NOTE (Vercel): default deploy clones can be shallow / tag-less; verify N on the
// first preview deploy and, if it's wrong, fetch tags + history in the build step.
function resolveBuildNumber(): number {
	const git = (cmd: string): string | null => {
		try {
			return execSync(`git ${cmd}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
		} catch {
			return null;
		}
	};
	const lastTag = git('describe --tags --abbrev=0');
	const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
	const count = git(`rev-list --count ${range}`);
	return count ? Number.parseInt(count, 10) || 0 : 0;
}

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
		__BUILD_NUMBER__: JSON.stringify(resolveBuildNumber())
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
