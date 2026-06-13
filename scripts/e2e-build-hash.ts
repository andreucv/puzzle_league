/**
 * Shared build-hash helpers for the E2E suite.
 *
 * The hash fingerprints src/ + the build-affecting config files so the preview
 * server can skip rebuilding when nothing changed. Both the server
 * (scripts/e2e-server.ts, which writes the hash after a build) and the
 * Playwright global setup (e2e/global-setup.ts, which reads it to detect a
 * stale warm server) must agree on the algorithm and the file location, so it
 * lives here in one place.
 */
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');

/**
 * Where the last successful build's hash is persisted. Lives under playwright/
 * (gitignored — see .gitignore) rather than playwright-out/, which is NOT
 * ignored and would otherwise commit the hash.
 */
export const BUILD_HASH_FILE = path.resolve(ROOT, 'playwright/.e2e-build-hash');

/**
 * Computes a hash of src/ + build-affecting config to detect source changes.
 *
 * `git ls-files -s` alone only reflects the index, so unstaged edits would
 * keep the hash stable and the suite would run against a stale build. Combine
 * the index with unstaged diffs and untracked file contents instead.
 */
export function computeBuildHash(): string {
    const paths = 'src/ svelte.config.js vite.config.ts package.json tsconfig.json';
    const git = (cmd: string, input?: string) =>
        execSync(cmd, { cwd: ROOT, encoding: 'utf-8', ...(input !== undefined && { input }) });

    const index = git(`git ls-files -s ${paths}`);
    const unstagedDiff = git(`git diff -- ${paths}`);
    const untrackedList = git(`git ls-files -o --exclude-standard ${paths}`).trim();
    const untrackedHashes = untrackedList
        ? git('git hash-object --stdin-paths', `${untrackedList}\n`)
        : '';

    return crypto.createHash('sha1')
        .update(index)
        .update(unstagedDiff)
        .update(untrackedList)
        .update(untrackedHashes)
        .digest('hex');
}

/** Reads the persisted hash from the last build, or null if none exists. */
export function readStoredHash(): string | null {
    return fs.existsSync(BUILD_HASH_FILE)
        ? fs.readFileSync(BUILD_HASH_FILE, 'utf-8').trim()
        : null;
}

/** Persists the given hash, creating the parent directory if needed. */
export function writeStoredHash(hash: string): void {
    fs.mkdirSync(path.dirname(BUILD_HASH_FILE), { recursive: true });
    fs.writeFileSync(BUILD_HASH_FILE, hash);
}
