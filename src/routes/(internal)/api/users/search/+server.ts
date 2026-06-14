import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchUsers } from '$lib/database/db_user';

/**
 * Masks an email so the UI can still disambiguate between users without exposing a
 * harvestable address. Any authenticated user can call this search, so returning raw
 * emails would let one logged-in user enumerate the whole user table's addresses.
 * Example: "andreu.cv@gmail.com" -> "an***@gmail.com".
 */
function maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***';
    const visible = local.slice(0, 2);
    return `${visible}${'*'.repeat(Math.max(local.length - visible.length, 1))}@${domain}`;
}

export const GET: RequestHandler = async (event) => {
    const query = event.url.searchParams.get('q');

    if (!query || query.length < 2) {
        return json({ users: [] });
    }

    try {
        const users = await searchUsers(query, 20);
        const masked = users.map((user) => ({
            ...user,
            email: maskEmail(user.email)
        }));
        return json({ users: masked });
    } catch (error) {
        console.error('Error searching users:', error);
        return json({ users: [], error: 'Failed to search users' }, { status: 500 });
    }
};
