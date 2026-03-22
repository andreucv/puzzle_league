import type { LayoutServerLoad } from "./$types";
import { loadTranslations, locales, translations } from "$lib/translations";
import { getUserWithRoles } from "$lib/database/database";

export const load: LayoutServerLoad = async ({ url, cookies, locals, request }) => {
    // Get the locales and translations for the current route
    const { pathname } = url;
    let locale = "es";
    // Get locale from Accept-Language header
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
        locale = acceptLanguage.split(',')[0].split('-')[0];
    }
    // Prefer the cookie value
    locale = cookies.get("lang") || locale;

    const supportedLocales = locales.get().map((l) => l.toLowerCase());
    if (!supportedLocales.includes(locale.toLowerCase())) {
        locale = "es";
    }

    loadTranslations(locale, pathname);

    let layoutData = {
        translations: translations.get(),
        i18n: { locale, route: pathname }
    };

    if (!locals.user) {
        return layoutData;
    }

    // Single DB query: fetch country, postalCode and roleAssignments together
    const user = await getUserWithRoles(locals.user);

    return {
        ...layoutData,
        user
    }
};
