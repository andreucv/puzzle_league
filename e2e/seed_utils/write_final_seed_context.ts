import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const DATA_FILE = 'test-data.json';

/**
 * Writes a typed seed result to the standard `test-data.json` file
 * in the same directory as the calling seed.ts.
 *
 * @param importMetaUrl - Pass `import.meta.url` from the suite's seed.ts
 * @param data          - The test data object to serialize
 */
export function writeSeedOutput<T>(importMetaUrl: string, data: T): void {
    const dir = dirname(fileURLToPath(importMetaUrl));
    const outPath = join(dir, DATA_FILE);
    writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Seed output written to ${outPath}`);
}
