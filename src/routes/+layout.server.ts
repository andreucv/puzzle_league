import type { LayoutServerLoad } from "./$types";
import { loadTranslations, locales, translations } from "$lib/translations";
import { auth } from "$lib/auth";
import { getRoleAssignments } from "$lib/database";

export const load = async ({ url, cookies, locals, request }) => {
    // Get user session
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    // Get the locales and translations for the current route
    const { pathname } = url;
    let locale = "es";
    // 1. Lets take the locale from the window browser object
    // Get locale from Accept-Language header
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
        // Parse the first preferred language
        locale = acceptLanguage.split(',')[0].split('-')[0];
    }
    // 2. Lets take the locale from the cookie
    locale = cookies.get("lang") || locale;

    const supportedLocales = locales.get().map((l) => l.toLowerCase());
    if (!supportedLocales.includes(locale.toLowerCase())) {
        locale = "es";
    }

    loadTranslations(locale, pathname);

    // Get here the user role assignments
    let roleAssignments = [];
    if (session?.user) {
        roleAssignments = await getRoleAssignments(session.user.id) || [];
    }

    return {
        translations: translations.get(),
        i18n: { locale, route: pathname },
        user: session?.user,
        roleAssignments
    };
};
