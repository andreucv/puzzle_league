import type { LayoutServerLoad } from "./$types";
import { loadTranslations, locales, translations } from "$lib/translations";
import { getUserWithRoles } from "$lib/database/db_user";
import { env } from '$env/dynamic/private';

// Locale priority: DB user preference > Accept-Language header > default "es"
function determineLocale(user, request) {
    let locale = "es"; // default

    if(user?.locale) {
        locale = user.locale;
    }
    else if(request.headers.get('accept-language')) {
        locale = request.headers.get('accept-language').split(',')[0].split('-')[0];
    }

    // We look for locales in our translations, if not supported, fallback to "es"
    if (!locales.get().map(l => l.toLowerCase()).includes(locale.toLowerCase())) {
        locale = "es";
    }

    return locale;
}

export const load: LayoutServerLoad = async ({ url, locals, request }) => {
    const { pathname } = url;

    // Fetch user data early so we can use their stored locale preference
    const user = locals.user ? await getUserWithRoles(locals.user) : null;

    // Locale priority: DB user preference > Accept-Language header > default "es"
    const locale = determineLocale(user, request);

    await loadTranslations(locale, pathname);

    const appVersion = env.VERCEL_ENV === 'preview' ? __APP_VERSION__ : null;

    let layoutData = {
        translations: translations.get(),
        i18n: { locale, route: pathname },
        appVersion
    };

    if (!user) {
        return layoutData;
    }

    return {
        ...layoutData,
        user
    }
};
