import type { LayoutServerLoad } from "./$types";
import type { RoleAssignment } from "@prisma/client";
import { loadTranslations, locales, translations } from "$lib/translations";
import { auth } from "$lib/auth";
import { getRoleAssignments, prisma } from "$lib/database";

export const load = async ({ url, cookies, locals, request }) => {
    // Get user session
    let session = undefined;
    let account = undefined;
    try {
        session = await auth.api.getSession({
            headers: request.headers,
        });
        account = await auth.api.listUserAccounts({
            headers: request.headers,
        });
    } catch (error) {
        console.error("(routes layout.server.ts) Error fetching user session:", error);
    }
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

    // Get here the user role assignments and full user data
    let roleAssignments: RoleAssignment[] = [];
    let fullUser = session?.user ?? null;
    if (session?.user) {
        const [assignments, dbUser] = await Promise.all([
            getRoleAssignments(session.user.id),
            prisma.user.findUnique({
                where: { id: session.user.id },
                select: { country: true, postalCode: true }
            })
        ]);
        roleAssignments = assignments || [];
        if (dbUser) {
            fullUser = { ...session.user, ...dbUser };
        }
    }

    return {
        translations: translations.get(),
        i18n: { locale, route: pathname },
        user: fullUser,
        account: account?.[0],
        roleAssignments
    };
};
