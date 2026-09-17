import { addTranslations, setLocale, setRoute } from '$lib/translations';
import { dev } from '$app/environment';
import { injectAnalytics } from '@vercel/analytics/sveltekit';
import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

// Their scripts are served from /_vercel/*, which only exists on Vercel; the e2e build disables them.
if (!import.meta.env.VITE_DISABLE_ANALYTICS) {
  injectAnalytics({ mode: dev ? 'development' : 'production' });
  injectSpeedInsights();
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
