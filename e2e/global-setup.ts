import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

dotenv.config({ path: path.resolve(ROOT, '.env') });

const STATE_FILE = path.resolve(ROOT, 'playwright/.test-server-state.json');
const PREVIEW_PORT = 4173;

interface ServerState {
    serverPid?: number;
    dbUrl?: string;
    buildHash?: string;
}

/** Waits for a TCP port to accept connections. */
function waitForPort(port: number, timeout = 30_000): Promise<void> {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const tryConnect = () => {
            const socket = net.createConnection({ port }, () => {
                socket.destroy();
                resolve();
            });
            socket.on('error', () => {
                if (Date.now() - start > timeout) {
                    reject(new Error(`Port ${port} not ready after ${timeout}ms`));
                } else {
                    setTimeout(tryConnect, 300);
                }
            });
        };
        tryConnect();
    });
}

/** Kill all processes listening on a given port. */
function killProcessesOnPort(port: number) {
    try {
        const output = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf-8' }).trim();
        if (output) {
            const pids = output.split('\n').map((p) => p.trim()).filter(Boolean);
            for (const pid of pids) {
                try {
                    process.kill(Number(pid), 'SIGKILL');
                    console.log(`   Killed leftover process ${pid} on port ${port}.`);
                } catch { /* already dead */ }
            }
        }
    } catch { /* lsof returns exit code 1 when no processes found */ }
}

/** Kills a leftover preview server from a previous run if state file exists. */
function killLeftoverServer() {
    if (fs.existsSync(STATE_FILE)) {
        try {
            const state: ServerState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
            if (state.serverPid) {
                try { process.kill(-state.serverPid, 'SIGTERM'); } catch { /* already dead */ }
                try { process.kill(state.serverPid, 'SIGTERM'); } catch { /* already dead */ }
            }
        } catch { /* best effort */ }
    }
    // Always kill anything on the preview port regardless of state file
    killProcessesOnPort(PREVIEW_PORT);
}

/** Computes a hash of src/ + config files using git to detect source changes. */
function computeBuildHash(): string {
    const cmd = `git ls-files -s src/ svelte.config.js vite.config.ts package.json tsconfig.json | git hash-object --stdin`;
    return execSync(cmd, { cwd: ROOT, encoding: 'utf-8' }).trim();
}

/** Checks if a TCP port is currently accepting connections. */
function isPortOpen(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = net.createConnection({ port }, () => {
            socket.destroy();
            resolve(true);
        });
        socket.on('error', () => resolve(false));
        socket.setTimeout(1000, () => {
            socket.destroy();
            resolve(false);
        });
    });
}

/** Runs a shell command, printing stdout/stderr and re-throwing with output on failure. */
function runCommand(cmd: string, opts: { cwd: string; env: NodeJS.ProcessEnv }) {
    try {
        execSync(cmd, { ...opts, stdio: 'inherit' });
    } catch (err: unknown) {
        const execErr = err as { stdout?: Buffer; stderr?: Buffer };
        const stdout = execErr.stdout?.toString() ?? '';
        const stderr = execErr.stderr?.toString() ?? '';
        console.error(`\n❌ Command failed: ${cmd}`);
        if (stdout) console.error(`STDOUT:\n${stdout}`);
        if (stderr) console.error(`STDERR:\n${stderr}`);
        throw err;
    }
}

export default async function globalSetup() {
    const testDbUrl = process.env.LOCAL_DATABASE_TEST_DATABASE_URL;
    if (!testDbUrl) {
        throw new Error('LOCAL_DATABASE_TEST_DATABASE_URL is not set in .env');
    }

    // Safety: refuse to run against remote databases
    if (!testDbUrl.includes('localhost') && !testDbUrl.includes('127.0.0.1')) {
        throw new Error(`LOCAL_DATABASE_TEST_DATABASE_URL does not point to localhost: ${testDbUrl}`);
    }

    // Read previous state and compute build hash to decide if build is needed
    let previousState: ServerState | null = null;
    if (fs.existsSync(STATE_FILE)) {
        try {
            previousState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
        } catch { /* corrupted state file */ }
    }

    const currentHash = computeBuildHash();
    const needsBuild = !previousState?.buildHash || previousState.buildHash !== currentHash;
    const serverIsUp = await isPortOpen(PREVIEW_PORT);

    console.log(`🔍 Build hash: ${currentHash}`);

    if (needsBuild) {
        console.log(`🔄 Source changed (hash: ${currentHash.slice(0, 8)}…) — rebuild required.`);
        killLeftoverServer();
    } else if (serverIsUp) {
        console.log(`⚡ Build cache hit + server running — reusing (hash: ${currentHash.slice(0, 8)}…).`);
    } else {
        console.log(`⚡ Build cache hit — skipping build (hash: ${currentHash.slice(0, 8)}…). Server needs restart.`);
        killProcessesOnPort(PREVIEW_PORT); // safety: kill orphan processes
    }

    console.log(`🧪 E2E test database: ${testDbUrl}`);

    // 1. Connect to database
    console.log('   🔌 Connecting to database...');
    const client = new pg.Client({ connectionString: testDbUrl });
    try {
        await client.connect();
    } catch (err) {
        throw new Error(`Cannot connect to test database. Is PostgreSQL running?\n${err}`);
    }

    // 2. Check if tables exist and flush data if needed
    try {
        const { rows: tables } = await client.query(
            `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
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

    // 3. Apply schema (creates tables if missing, applies new migrations)
    console.log('   🔧 Applying schema (prisma db push)...');
    runCommand('npx prisma db push --accept-data-loss', {
        cwd: ROOT,
        env: { ...process.env, DATABASE_URL: testDbUrl },
    });

    // 4. Seed test users
    console.log('   🌱 Seeding test users...');
    runCommand('npx tsx scripts/db_migration/action_seed_local_users.ts', {
        cwd: ROOT,
        env: { ...process.env, DATABASE_URL: testDbUrl },
    });

    // 5. Build the app (skip if source hasn't changed)
    if (needsBuild) {
        console.log('   🏗️  Building app...');
        runCommand('npm run build', {
            cwd: ROOT,
            env: {
                ...process.env,
                DATABASE_URL: testDbUrl,
                BETTER_AUTH_URL: `http://localhost:${PREVIEW_PORT}`,
            },
        });
    }

    // 6. Start preview server (skip if already running with same build)
    let serverPid: number;
    if (!needsBuild && serverIsUp && previousState?.serverPid) {
        serverPid = previousState.serverPid;
        console.log(`   ✅ Reusing preview server (PID: ${serverPid})\n`);
    } else {
        console.log('   🚀 Starting preview server...');
        const server = spawn('npm', ['run', 'preview', '--', '--host'], {
            cwd: ROOT,
            stdio: 'pipe',
            detached: true,
            env: {
                ...process.env,
                DATABASE_URL: testDbUrl,
                BETTER_AUTH_URL: `http://localhost:${PREVIEW_PORT}`,
            },
        });

        server.unref();

        if (!server.pid) {
            throw new Error('Failed to start preview server: no PID');
        }

        server.stdout?.on('data', (d: Buffer) => process.stdout.write(`[preview] ${d}`));
        server.stderr?.on('data', (d: Buffer) => process.stderr.write(`[preview] ${d}`));

        console.log(`   ⏳ Waiting for port ${PREVIEW_PORT}...`);
        await waitForPort(PREVIEW_PORT);
        console.log(`   ✅ Preview server ready (PID: ${server.pid})\n`);
        serverPid = server.pid;
    }

    // 7. Write state file for teardown
    const state: ServerState = { serverPid, dbUrl: testDbUrl, buildHash: currentHash };
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

    // 8. Set env for Playwright test processes
    process.env.DATABASE_URL = testDbUrl;
    process.env.BETTER_AUTH_URL = `http://localhost:${PREVIEW_PORT}`;
}
