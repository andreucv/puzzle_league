import { auth } from "$lib/auth";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ request }) => {
	const session = await auth.api.getSession({
		headers: request.headers,
	});
	console.log('+page.server.ts session', session);

	return {
		props: {
			session
		}
	};
};
