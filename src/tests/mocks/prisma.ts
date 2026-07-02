// Typed deep mock for the Prisma client singleton.
//
// Replaces the per-suite hand-rolled `makeTx()` objects of `vi.fn()`s (cast through `as any`)
// with a single type-safe `DeepMockProxy<PrismaClient>`. Every model/method is auto-mocked and
// fully typed, so `prismaMock.entry.create.mockResolvedValue(...)` is checked against the real
// Prisma types and model drift surfaces at compile time.
//
// Usage in a suite (the `vi.mock` MUST live in the test file — vitest hoists it per-file):
//
//   import { prismaMock } from '$tests/mocks/prisma';
//   vi.mock('$lib/database/create_prisma_client', () => ({ prisma: prismaMock }));
//
// For code that runs inside `prisma.$transaction(async (tx) => …)`, call `mockPrismaTransaction()`
// (e.g. in a `beforeEach`) so the interactive callback receives the same deep mock as `tx`.
import { beforeEach, type Mock } from 'vitest';
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended';
import type { PrismaClient } from '$prisma/client';

export const prismaMock: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();

// Reset call history AND configured return values before every test so nothing leaks across
// tests. Registered here (module-scoped) so importing suites get it automatically; runs in the
// importing file's suite context.
beforeEach(() => {
	mockReset(prismaMock);
});

/**
 * Narrow a deep-mocked Prisma method to vitest's `Mock` so `.mockResolvedValue(partial)` type-checks
 * against partial fixtures without rebuilding a full Prisma model. The method NAME is still validated
 * by `prismaMock` (a typo like `prismaMock.competition.findUnqiue` won't compile), which is the
 * type-safety this seam buys; full return-payload typing is the job of the shared factories (P3).
 */
export function mockFn(method: unknown): Mock {
	return method as unknown as Mock;
}

/**
 * Wire `prisma.$transaction` so the interactive (callback) form invokes its callback with the
 * deep mock itself as the transaction client, and the batch (array) form resolves all promises.
 * Call this after `mockReset` (e.g. in a `beforeEach`) in suites that exercise `$transaction`.
 */
export function mockPrismaTransaction(): void {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	prismaMock.$transaction.mockImplementation((arg: any) => {
		return typeof arg === 'function' ? arg(prismaMock) : Promise.all(arg);
	});
}
