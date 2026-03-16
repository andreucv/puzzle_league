import { vi } from 'vitest';
import { readable } from 'svelte/store';

// Mock $lib/translations — t returns a readable store that acts as an identity function
const tStore = readable((key: string) => key);
export const t = tStore;
export const loading = readable(false);
export const locales = readable(['en']);
export const locale = readable('en');
export const translations = readable({});
export const loadTranslations = vi.fn();
export const addTranslations = vi.fn();
export const setLocale = vi.fn();
export const setRoute = vi.fn();
