import i18n from 'sveltekit-i18n';
import { dev } from '$app/environment';
import lang from './lang.json';

export const defaultLocale = 'en';

/** @type {import('sveltekit-i18n').Config} */
export const config = {
  log: {
    level: dev ? 'warn' : 'error',
  },
  translations: {
    en: { lang },
    es: { lang },
    ca: { lang },
  },
  loaders: [
    {
      locale: 'en',
      key: '',
      loader: async () => (await import('./en/common.json')).default,
    },
    {
      locale: 'es',
      key: '',
      loader: async () => (await import('./es/common.json')).default,
    },
    {
      locale: 'ca',
      key: '',
      loader: async () => (await import('./ca/common.json')).default,
    },
  ],
};

// Widen the interpolation payload so `$t('key', { foo, bar })` accepts arbitrary keys
// instead of only the parser's default `{ default?: any }` payload.
export const { t, loading, locales, locale, translations, loadTranslations, addTranslations, setLocale, setRoute } =
  /** @type {import('sveltekit-i18n').default<import('sveltekit-i18n').Parser.Params<Record<string, any>>, Record<string, any>>} */ (
    new i18n(config)
  );

loading.subscribe(($loading) => $loading && console.log('Loading translations...'));
