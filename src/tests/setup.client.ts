// Setup for the `client` Vitest project (jsdom): component/Svelte suites (`*.svelte.test.ts`).
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';

// Auto-unmount rendered components after every test so suites don't each need a manual
// cleanup() in beforeEach/afterEach.
afterEach(() => {
	cleanup();
});

// jsdom doesn't implement the Web Animations API that Svelte's flip/slide transitions call.
// Polyfill once here instead of inlining the guards in individual suites (e.g. CategoryCard).
if (!Element.prototype.animate) {
	Element.prototype.animate = (() => ({
		cancel: () => {},
		finished: Promise.resolve(),
	})) as unknown as typeof Element.prototype.animate;
}
if (!Element.prototype.getAnimations) {
	Element.prototype.getAnimations = (() => []) as unknown as typeof Element.prototype.getAnimations;
}

// jsdom doesn't implement scrollIntoView (used by EntryList's deep-link autoselect).
if (!Element.prototype.scrollIntoView) {
	Element.prototype.scrollIntoView = () => {};
}
