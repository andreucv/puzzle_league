import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const STATE_FILE = path.resolve(ROOT, 'playwright/.test-server-state.json');
const PREVIEW_PORT = 4173;

interface ServerState {
    serverPid?: number;
    dbUrl?: string;
    buildHash?: string;
}

/** Kill all processes listening on the preview port. */
function killProcessesOnPort(port: number) {
    try {
        const output = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf-8' }).trim();
        if (output) {
            const pids = output.split('\n').map((p) => p.trim()).filter(Boolean);
            for (const pid of pids) {
                try {
                    process.kill(Number(pid), 'SIGKILL');
                    console.log(`   Killed process ${pid} on port ${port}.`);
                } catch { /* already dead */ }
            }
        }
    } catch { /* lsof returns exit code 1 when no processes found */ }
}

export default async function globalTeardown() {
    if (!fs.existsSync(STATE_FILE)) {
        console.log('⚠️  No server state file found — skipping teardown.');
        // Still try to kill anything on the port as a safety net
        killProcessesOnPort(PREVIEW_PORT);
        return;
    }

    const state: ServerState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));

    if (!state.serverPid) {
        console.log('   No server PID in state file — nothing to stop.');
        killProcessesOnPort(PREVIEW_PORT);
        return;
    }

    // Stop the preview server via PID
    console.log(`\n🛑 Stopping preview server (PID: ${state.serverPid})...`);
    try {
        process.kill(-state.serverPid, 'SIGTERM');
    } catch {
        try {
            process.kill(state.serverPid, 'SIGTERM');
        } catch {
            console.log('   Server process already stopped.');
        }
    }

    // Wait briefly for graceful shutdown, then force-kill anything still on the port
    await new Promise((r) => setTimeout(r, 1000));
    killProcessesOnPort(PREVIEW_PORT);

    // Preserve build hash for next run, remove server PID
    const newState: ServerState = { buildHash: state.buildHash };
    fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));
    console.log('   ✅ Server stopped. Build hash preserved.\n');
}
