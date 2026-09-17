/**
 * E2E web server: prepares the test database, builds the app (skipped when
 * sources are unchanged), and runs the preview server in the foreground.
 *
 * Invoked by Playwright's `webServer` (playwright.config.ts), which owns the
 * process lifecycle. Run it manually in a terminal to keep a warm server
 * across local test runs (`reuseExistingServer` picks it up):
 *
 *     npx tsx e2e/e2e-server.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { computeBuildHash, readStoredHash, writeStoredHash } from '../scripts/e2e-build-hash';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');

dotenv.config({ path: path.resolve(ROOT, '.env') });

const PREVIEW_PORT = 4173;

async function prepareDatabase(testDbUrl: string, env: NodeJS.ProcessEnv) {
    console.log(`🧪 E2E test database: ${testDbUrl}`);
    const client = new pg.Client({ connectionString: testDbUrl });
    try {
        await client.connect();
    } catch (err) {
        throw new Error(`Cannot connect to test database. Is PostgreSQL running?\n${err}`);
    }

    try {
        const { rows: tables } = await client.query(
            `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
        );
        if (tables.length === 0) {
            console.log('   ✅ Empty database — schema will be created.');
        } else {
            console.log(`   📋 Found ${tables.length} tables. Flushing data...`);
            const tableNames = tables.map((t: { tablename: string }) => `"${t.tablename}"`).join(', ');
            await client.query(`TRUNCATE ${tableNames} CASCADE`);
            console.log('   ✅ Database flushed.');
        }
    } finally {
        await client.end();
    }

    console.log('   🔧 Applying schema (prisma db push)...');
    execSync('npx prisma db push --accept-data-loss', { cwd: ROOT, env, stdio: 'inherit' });

    console.log('   🌱 Seeding bootstrap test users...');
    execSync('npx tsx scripts/db_migration/action_seed_local_users.ts', { cwd: ROOT, env, stdio: 'inherit' });
}

function buildIfChanged(env: NodeJS.ProcessEnv) {
    const currentHash = computeBuildHash();
    const previousHash = readStoredHash();

    if (previousHash === currentHash) {
        console.log(`⚡ Build cache hit — skipping build (hash: ${currentHash.slice(0, 8)}…).`);
        return;
    }

    console.log(`🏗️  Source changed (hash: ${currentHash.slice(0, 8)}…) — building app...`);
    execSync('npm run build', { cwd: ROOT, env, stdio: 'inherit' });
    writeStoredHash(currentHash);
}

async function main() {
    const testDbUrl = process.env.LOCAL_DATABASE_TEST_DATABASE_URL;
    if (!testDbUrl) {
        throw new Error('LOCAL_DATABASE_TEST_DATABASE_URL is not set in .env');
    }
    // Safety: refuse to run against remote databases
    if (!testDbUrl.includes('localhost') && !testDbUrl.includes('127.0.0.1')) {
        throw new Error(`LOCAL_DATABASE_TEST_DATABASE_URL does not point to localhost: ${testDbUrl}`);
    }

    const env: NodeJS.ProcessEnv = {
        ...process.env,
        DATABASE_URL: testDbUrl,
        DATABASE_ACCELERATE_URL: testDbUrl,
        BETTER_AUTH_URL: `http://localhost:${PREVIEW_PORT}`,
        // Never hit Scaleway from e2e: emails are logged by scaleway_email.mock.ts instead.
        MOCK_EMAILS: 'true',
    };

    await prepareDatabase(testDbUrl, env);
    buildIfChanged(env);

    console.log(`🚀 Starting preview server on port ${PREVIEW_PORT}...`);
    const server = spawn('npm', ['run', 'preview', '--', '--host'], {
        cwd: ROOT,
        env,
        stdio: 'inherit',
    });

    for (const signal of ['SIGTERM', 'SIGINT'] as const) {
        process.on(signal, () => server.kill(signal));
    }
    server.on('exit', (code) => process.exit(code ?? 0));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
