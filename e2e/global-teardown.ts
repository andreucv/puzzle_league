import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const STATE_FILE = path.resolve(ROOT, 'playwright/.test-server-state.json');

interface ServerState {
    serverPid: number;
    dbUrl: string;
}

export default async function globalTeardown() {
    if (!fs.existsSync(STATE_FILE)) {
        console.log('⚠️  No server state file found — skipping teardown.');
        return;
    }

    const state: ServerState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));

    // Stop the preview server
    console.log(`\n🛑 Stopping preview server (PID: ${state.serverPid})...`);
    try {
        // Kill the process group (negative PID) so child processes are also killed
        process.kill(-state.serverPid, 'SIGTERM');
    } catch {
        try {
            process.kill(state.serverPid, 'SIGTERM');
        } catch {
            console.log('   Server already stopped.');
        }
    }

    // Clean up state file
    fs.unlinkSync(STATE_FILE);
    console.log('   ✅ Server stopped.\n');
}
