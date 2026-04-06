import { addTranslations, setLocale, setRoute } from '$lib/translations';
import { dev } from '$app/environment';
import { browser } from '$app/environment';

// Defer analytics injection so it doesn't block initial interactivity (INP)
if (browser) {
    setTimeout(() => {
        import('@vercel/analytics/sveltekit').then(({ injectAnalytics }) => {
            injectAnalytics({ mode: dev ? 'development' : 'production' });
        });
        import('@vercel/speed-insights/sveltekit').then(({ injectSpeedInsights }) => {
            injectSpeedInsights();
        });
    }, 0);
}

/** @type {import('@sveltejs/kit').Load} */
export const load = async ({ data }) => {
  const { i18n, translations } = data;
  const { locale, route } = i18n;

  addTranslations(translations);

  await setRoute(route);
  await setLocale(locale);

  return data;
};
