import type { LayoutServerLoad } from "./$types";
import { loadTranslations, locales, translations } from "$lib/translations";
import { getUserWithRoles } from "$lib/database/database";

// Locale priority: DB user preference > Accept-Language header > default "es"
function determineLocale(locals, request) {
    let locale = "es"; // default

    if(locals.user?.locale) {
        locale = locals.user.locale;
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

    // Locale priority: DB user preference > cookie > Accept-Language header > default "es"
    const locale = determineLocale(locals, request);

    loadTranslations(locale, pathname);

    let layoutData = {
        translations: translations.get(),
        i18n: { locale, route: pathname }
    };

    if (!user) {
        return layoutData;
    }

    return {
        ...layoutData,
        user
    }
};
