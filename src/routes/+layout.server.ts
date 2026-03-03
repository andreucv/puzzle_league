import type { LayoutServerLoad } from "./$types";
import { loadTranslations, locales, translations } from "$lib/translations";
import { getRoleAssignments, prisma } from "$lib/database/database";

export const load: LayoutServerLoad = async ({ url, cookies, locals, request }) => {
    // Use session already resolved by hooks.server.ts — avoids a duplicate auth round-trip
    const sessionUser = locals.user ?? null;

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

    if (!sessionUser) {
        return {
            translations: translations.get(),
            i18n: { locale, route: pathname },
            user: null,
            roleAssignments: [],
        };
    }

    // Run both DB queries in parallel — no sequential waterfall here
    const [assignments, dbUser] = await Promise.all([
        getRoleAssignments(sessionUser.id),
        prisma.user.findUnique({
            where: { id: sessionUser.id },
            select: { country: true, postalCode: true }
        })
    ]);

    const fullUser = dbUser ? { ...sessionUser, ...dbUser } : sessionUser;

    return {
        translations: translations.get(),
        i18n: { locale, route: pathname },
        user: fullUser,
        roleAssignments: assignments ?? [],
    };
};
