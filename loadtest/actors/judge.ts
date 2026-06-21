import { signIn, recordFinish, recordPieces, type HttpClient } from '../http';

/**
 * A judge: signs in once, then records finishes (phase 1, LIVE) and piece counts (phase 2,
 * STOPPED). Each judge is its own auth identity, which keeps its per-minute write rate well under
 * the 60/min API limit even at the peak of the accelerating finish cadence.
 */
export interface Judge {
	finish(entryId: string): Promise<void>;
	pieces(entryId: string): Promise<void>;
}

export async function createJudge(
	client: HttpClient,
	email: string,
	password: string
): Promise<Judge> {
	const cookie = await signIn(client, email, password);
	let table = 0;

	return {
		async finish(entryId: string) {
			table++;
			await recordFinish(client, cookie, entryId, new Date().toISOString(), table);
		},
		async pieces(entryId: string) {
			// DNF entries are ranked by completed pieces; pick a plausible non-zero count.
			const n = 100 + Math.floor(Math.random() * 400);
			await recordPieces(client, cookie, entryId, n);
		}
	};
}
