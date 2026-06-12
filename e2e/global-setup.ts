import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');

dotenv.config({ path: path.resolve(ROOT, '.env') });

const PREVIEW_PORT = 4173;

/**
 * Points the Playwright process (and its workers, which run seed scripts
 * in-process) at the test database. Server lifecycle and DB preparation live
 * in scripts/e2e-server.ts, launched via the webServer config block.
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
}
