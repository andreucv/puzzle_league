import dotenv from 'dotenv';
import net from 'net';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { computeBuildHash, readStoredHash } from '../scripts/e2e-build-hash';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');

dotenv.config({ path: path.resolve(ROOT, '.env') });

const PREVIEW_PORT = 4173;

/** Resolves true if something is already listening on the preview port. */
function isPortListening(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = net.connect({ port, host: '127.0.0.1' });
        socket.once('connect', () => { socket.destroy(); resolve(true); });
        socket.once('error', () => { socket.destroy(); resolve(false); });
    });
}

/** Best-effort PID of the process listening on the port (macOS/Linux lsof). */
function findListeningPid(port: number): string | null {
    try {
        const out = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, {
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        return out.split('\n')[0] || null;
    } catch {
        return null;
    }
}

/**
 * Guards against a stale warm server.
 *
 * scripts/e2e-build-hash only rebuilds (and refreshes the stored hash) when
 * e2e-server.ts boots. When a warm server is already running and Playwright
 * reuses it (`reuseExistingServer`), nothing re-checks the hash — so source
 * edits would be served stale and tested green. global-setup runs on every
 * `playwright test` invocation, so we re-check here: if a server is already
 * listening and the current source hash no longer matches the build it was
 * started from, fail loudly and tell the dev to restart the warm server.
 *
 * A freshly-started server (CI, or no warm server) is not yet listening here,
 * or has just written the matching hash, so this never false-positives.
 */
async function assertWarmServerNotStale() {
    if (process.env.CI) return;
    if (!(await isPortListening(PREVIEW_PORT))) return;

    const stored = readStoredHash();
    const current = computeBuildHash();
    if (stored !== null && stored !== current) {
        const pid = findListeningPid(PREVIEW_PORT);
        const killCmd = pid
            ? `kill ${pid}`
            : `lsof -nP -iTCP:${PREVIEW_PORT} -sTCP:LISTEN -t | xargs kill`;
        throw new Error(
            `Stale E2E warm server detected on port ${PREVIEW_PORT}.\n` +
            `  Source changed since it was built (built: ${stored.slice(0, 8)}…, now: ${current.slice(0, 8)}…).\n` +
            `  Kill it, then re-run (Playwright will rebuild on cold start):\n` +
            `    ${killCmd}\n` +
            `  Or restart it as a warm server so it rebuilds:\n` +
            `    ${killCmd} && npx tsx e2e/e2e-server.ts`,
        );
    }
}

/**
 * Points the Playwright process (and its workers, which run seed scripts
 * in-process) at the test database. Server lifecycle and DB preparation live
 * in e2e/e2e-server.ts, launched via the webServer config block.
 */
export default async function globalSetup() {
    const testDbUrl = process.env.LOCAL_DATABASE_TEST_DATABASE_URL;
    if (!testDbUrl) {
        throw new Error('LOCAL_DATABASE_TEST_DATABASE_URL is not set in .env');
    }
    // Safety: refuse to run against remote databases
    if (!testDbUrl.includes('localhost') && !testDbUrl.includes('127.0.0.1')) {
        throw new Error(`LOCAL_DATABASE_TEST_DATABASE_URL does not point to localhost: ${testDbUrl}`);
    }

    process.env.DATABASE_URL = testDbUrl;
    process.env.DATABASE_ACCELERATE_URL = testDbUrl;
    process.env.BETTER_AUTH_URL = `http://localhost:${PREVIEW_PORT}`;

    await assertWarmServerNotStale();
}
