import { addTranslations, setLocale, setRoute } from '$lib/translations';
import { dev } from '$app/environment';
import { injectAnalytics } from '@vercel/analytics/sveltekit';
import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

injectAnalytics({ mode: dev ? 'development' : 'production' });
injectSpeedInsights();

import * as Swetrix from 'swetrix'

Swetrix.init(process.env.SWETRIX_API_ID!);
Swetrix.trackViews()

/** @type {import('@sveltejs/kit').Load} */
export const load = async ({ data }) => {
  const { i18n, translations } = data;
  const { locale, route } = i18n;

  addTranslations(translations);

  await setRoute(route);
  await setLocale(locale);

  return data;
};
