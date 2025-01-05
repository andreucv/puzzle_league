import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { loadTranslations, locales, translations } from "$lib/translations";

export const load = (({ url, locals, cookies }) => {
    console.log("layout.server.ts loading locals from load function: ", locals.user);
    
    const { pathname } = url;

    let locale = "es";
    // 1. Lets take the locale from the window browser object
    if (typeof window !== "undefined") {
        locale = window.navigator.language;
    }
    // 2. Lets take the locale from the cookie
    locale = cookies.get("lang") || locale;

    const supportedLocales = locales.get().map((l) => l.toLowerCase());
    if (!supportedLocales.includes(locale.toLowerCase())) {
        locale = "es";
    }

    loadTranslations(locale, pathname);

    return {
        i18n: { locale, route: pathname },
        translations: translations.get(), 
        user: locals.user,
        participant: locals.participant
    };
}) satisfies LayoutServerLoad;