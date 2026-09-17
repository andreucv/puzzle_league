import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CategoryStatus, RegistrationStatus } from '$prisma/enums';
import { prismaMock, mockFn } from '$tests/mocks/prisma';

const mockNotifyCreated = vi.fn().mockReturnValue([]);
const mockNotifyWaitlisted = vi.fn().mockReturnValue([]);
const mockNotifyConfirmed = vi.fn().mockReturnValue([]);
const mockNotifyRefused = vi.fn().mockReturnValue([]);
const mockNotifyPromotion = vi.fn().mockReturnValue([]);
const mockDispatch = vi.fn().mockResolvedValue({ persisted: 0, emailed: 0, emailFailures: 0 });

vi.mock('$lib/database/create_prisma_client', () => ({ prisma: prismaMock }));

const mockTransaction = mockFn(prismaMock.$transaction);

vi.mock('$lib/notifications/registration_notifications', () => ({
	notificationsForRegistrationCreated: (...args: unknown[]) => mockNotifyCreated(...args),
	notificationsForRegistrationWaitlisted: (...args: unknown[]) => mockNotifyWaitlisted(...args),
	notificationsForRegistrationConfirmed: (...args: unknown[]) => mockNotifyConfirmed(...args),
	notificationsForRegistrationRefused: (...args: unknown[]) => mockNotifyRefused(...args),
	notificationsForWaitlistPromotion: (...args: unknown[]) => mockNotifyPromotion(...args),
}));

vi.mock('$lib/notifications/dispatcher', () => ({
	dispatchNotifications: (...args: unknown[]) => mockDispatch(...args),
}));

import {
	RegistrationWorkflowError,
	confirmRegistration,
	refuseRegistration,
	submitRegistration,
	unregisterRegistration,
} from './registration-workflow';

// The interactive `$transaction` callback receives the deep prismaMock as its `tx`. makeTx()
// exposes the same mock methods (loosened to vitest's Mock so partial fixtures type-check) plus
// the defaults the workflow relies on — mockReset (in $tests/mocks/prisma) clears these per test.
function makeTx() {
	const tx = {
		competition: {
			findUnique: mockFn(prismaMock.competition.findUnique),
		},
		category: {
			findMany: mockFn(prismaMock.category.findMany),
			findUniqueOrThrow: mockFn(prismaMock.category.findUniqueOrThrow),
		},
		entry: {
			count: mockFn(prismaMock.entry.count),
			findMany: mockFn(prismaMock.entry.findMany),
			findFirst: mockFn(prismaMock.entry.findFirst),
			findUnique: mockFn(prismaMock.entry.findUnique),
			create: mockFn(prismaMock.entry.create),
			update: mockFn(prismaMock.entry.update),
			delete: mockFn(prismaMock.entry.delete),
		},
		user: {
			findMany: mockFn(prismaMock.user.findMany),
		},
		externalParticipant: {
			findMany: mockFn(prismaMock.externalParticipant.findMany),
		},
		roleAssignment: {
			findFirst: mockFn(prismaMock.roleAssignment.findFirst),
		},
		competitionCoorganizerRoleAssignment: {
			findFirst: mockFn(prismaMock.competitionCoorganizerRoleAssignment.findFirst),
		},
	};
	tx.entry.count.mockResolvedValue(0);
	tx.entry.findMany.mockResolvedValue([]);
	tx.entry.delete.mockResolvedValue({});
	return tx;
}

function makeCompetition(overrides: Record<string, unknown> = {}) {
	return {
		id: 42,
		name: 'Speed Cup',
		registrationOpen: true,
		showPaymentWarning: true,
		creatorId: 'organizer-1',
		...overrides,
	};
}

function makeCategory(overrides: Record<string, unknown> = {}) {
	const competition = makeCompetition(overrides.competition as Record<string, unknown> | undefined);
	return {
		id: 1,
		competitionId: competition.id,
		description: 'Individual',
		subname: null,
		type: 'INDIVIDUAL',
		status: CategoryStatus.NOT_STARTED,
		maxPartySize: 1,
		maxParties: null,
		price: 500,
		competition,
		...overrides,
	};
}

function makeEntry(overrides: Record<string, unknown> = {}) {
	return {
		id: 'entry-1',
		categoryId: 1,
		creatorId: 'user-1',
		status: RegistrationStatus.PENDING_CONFIRMATION,
		users: [{ id: 'user-1', name: 'Alice', email: 'alice@example.com', image: null }],
		externalParticipants: [],
		category: {
			competitionId: 42,
			description: 'Individual',
			subname: null,
			type: 'INDIVIDUAL',
			maxParties: 2,
			competition: { name: 'Speed Cup' },
		},
		...overrides,
	};
}

function setupSignupTx(category = makeCategory(), competition = category.competition) {
	const tx = makeTx();
	tx.competition.findUnique.mockResolvedValue(competition);
	tx.category.findMany.mockResolvedValue([category]);
	tx.user.findMany.mockResolvedValue([{ id: 'user-1' }]);
	tx.entry.create.mockImplementation(async ({ data }: any) => makeEntry({
		categoryId: data.categoryId,
		status: data.status,
		category,
	}));
	mockTransaction.mockImplementation(async (callback) => callback(tx));
	return tx;
}

describe('registration workflow', () => {
	it('creates paid participant registrations as pending confirmation', async () => {
		const tx = setupSignupTx();

		const result = await submitRegistration({
			competitionId: 42,
			actor: { userId: 'user-1', name: 'Alice', isOrganizer: false },
			signups: [{ categoryId: 1, teammateIds: [] }],
		});

		expect(tx.entry.create).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({ status: RegistrationStatus.PENDING_CONFIRMATION }),
		}));
		expect(result.entries[0].status).toBe(RegistrationStatus.PENDING_CONFIRMATION);
	});

	it('creates free participant registrations as confirmed', async () => {
		const category = makeCategory({ price: 0 });
		const tx = setupSignupTx(category);

		await submitRegistration({
			competitionId: 42,
			actor: { userId: 'user-1', name: 'Alice', isOrganizer: false },
			signups: [{ categoryId: 1, teammateIds: [] }],
		});

		expect(tx.entry.create).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({ status: RegistrationStatus.CONFIRMED }),
		}));
	});

	it('lets organizer registration override a closed competition and auto-confirm', async () => {
		const competition = makeCompetition({ registrationOpen: false });
		const category = makeCategory({ competition });
		const tx = setupSignupTx(category, competition);

		await submitRegistration({
			competitionId: 42,
			actor: { userId: 'organizer-1', name: 'Organizer', isOrganizer: true },
			signups: [{ categoryId: 1, teammateIds: [] }],
		});

		expect(tx.entry.count).not.toHaveBeenCalledWith(expect.objectContaining({
			where: expect.objectContaining({ creatorId: 'organizer-1' }),
		}));
		expect(tx.entry.create).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({ status: RegistrationStatus.CONFIRMED }),
		}));
	});

	it('rejects participant signup when competition registration is closed', async () => {
		const competition = makeCompetition({ registrationOpen: false });
		setupSignupTx(makeCategory({ competition }), competition);

		await expect(submitRegistration({
			competitionId: 42,
			actor: { userId: 'user-1', name: 'Alice', isOrganizer: false },
			signups: [{ categoryId: 1, teammateIds: [] }],
		})).rejects.toMatchObject({
			code: 'REGISTRATION_CLOSED',
			message: 'Registration is currently closed for this competition',
		});
	});

	it('rejects signup when category is not started anymore', async () => {
		setupSignupTx(makeCategory({ status: CategoryStatus.LIVE }));

		await expect(submitRegistration({
			competitionId: 42,
			actor: { userId: 'user-1', name: 'Alice', isOrganizer: false },
			signups: [{ categoryId: 1, teammateIds: [] }],
		})).rejects.toMatchObject({
			code: 'INVALID_STATUS',
		});
	});

	it('waitlists new entries when reserved slots are full', async () => {
		const category = makeCategory({ maxParties: 1 });
		const tx = setupSignupTx(category);
		tx.entry.count.mockImplementation(async ({ where }: any) => {
			if (where.status?.in) return 1;
			return 0;
		});

		const result = await submitRegistration({
			competitionId: 42,
			actor: { userId: 'user-1', name: 'Alice', isOrganizer: false },
			signups: [{ categoryId: 1, teammateIds: [] }],
		});

		expect(result.entries[0].status).toBe(RegistrationStatus.WAITLISTED);
		expect(mockNotifyWaitlisted).toHaveBeenCalledOnce();
	});

	it('promotes the oldest waitlisted entry when unregistering releases a slot', async () => {
		const tx = makeTx();
		const promotedEntry = makeEntry({ id: 'waitlisted-1', status: RegistrationStatus.PENDING_CONFIRMATION });
		tx.entry.findUnique.mockResolvedValue(makeEntry({ status: RegistrationStatus.CONFIRMED }));
		tx.entry.count.mockResolvedValue(1);
		tx.entry.findFirst.mockResolvedValue({ id: 'waitlisted-1' });
		tx.category.findUniqueOrThrow.mockResolvedValue({
			price: 500,
			competition: { showPaymentWarning: true },
		});
		tx.entry.update.mockResolvedValue(promotedEntry);
		mockTransaction.mockImplementation(async (callback) => callback(tx));

		const result = await unregisterRegistration({
			entryId: 'entry-1',
			actor: { userId: 'user-1', name: 'Alice', isOrganizer: false },
		});

		expect(tx.entry.delete).toHaveBeenCalledWith({ where: { id: 'entry-1' } });
		expect(result.promotedEntry).toEqual(promotedEntry);
		expect(mockNotifyPromotion).toHaveBeenCalledWith(promotedEntry);
	});

	it('promotes waitlisted entry when organizer refuses a confirmed entry', async () => {
		const tx = makeTx();
		const refusedEntry = makeEntry({ status: RegistrationStatus.CONFIRMED });
		const promotedEntry = makeEntry({ id: 'waitlisted-1', status: RegistrationStatus.PENDING_CONFIRMATION });
		tx.entry.findUnique.mockResolvedValue(refusedEntry);
		tx.competition.findUnique.mockResolvedValue({ creatorId: 'organizer-1' });
		tx.entry.count.mockResolvedValue(1);
		tx.entry.findFirst.mockResolvedValue({ id: 'waitlisted-1' });
		tx.category.findUniqueOrThrow.mockResolvedValue({
			price: 500,
			competition: { showPaymentWarning: true },
		});
		tx.entry.update.mockResolvedValue(promotedEntry);
		mockTransaction.mockImplementation(async (callback) => callback(tx));

		const result = await refuseRegistration({
			entryId: 'entry-1',
			actor: { userId: 'organizer-1', name: 'Organizer', isOrganizer: false },
		});

		expect(result.entry).toEqual(refusedEntry);
		expect(result.promotedEntry).toEqual(promotedEntry);
		expect(mockNotifyRefused).toHaveBeenCalledWith(refusedEntry, 'Organizer');
		expect(mockNotifyPromotion).toHaveBeenCalledWith(promotedEntry, 'Organizer');
	});

	it('returns the updated confirmed entry when organizer confirms a pending entry', async () => {
		const tx = makeTx();
		const pendingEntry = makeEntry({ status: RegistrationStatus.PENDING_CONFIRMATION });
		const confirmedEntry = makeEntry({ status: RegistrationStatus.CONFIRMED });
		tx.entry.findUnique.mockResolvedValue(pendingEntry);
		tx.competition.findUnique.mockResolvedValue({ creatorId: 'organizer-1' });
		tx.entry.update.mockResolvedValue(confirmedEntry);
		mockTransaction.mockImplementation(async (callback) => callback(tx));

		const result = await confirmRegistration({
			entryId: 'entry-1',
			actor: { userId: 'organizer-1', name: 'Organizer', isOrganizer: false },
		});

		expect(tx.entry.update).toHaveBeenCalledWith(expect.objectContaining({
			data: expect.objectContaining({ status: RegistrationStatus.CONFIRMED }),
		}));
		expect(result.entry.status).toBe(RegistrationStatus.CONFIRMED);
		expect(mockNotifyConfirmed).toHaveBeenCalledWith(pendingEntry, 'Organizer');
	});

	it('rejects confirmation by users who cannot manage the competition', async () => {
		const tx = makeTx();
		tx.entry.findUnique.mockResolvedValue(makeEntry());
		tx.competition.findUnique.mockResolvedValue({ creatorId: 'organizer-1' });
		tx.roleAssignment.findFirst.mockResolvedValue(null);
		mockTransaction.mockImplementation(async (callback) => callback(tx));

		await expect(confirmRegistration({
			entryId: 'entry-1',
			actor: { userId: 'user-1', isOrganizer: false },
		})).rejects.toBeInstanceOf(RegistrationWorkflowError);
	});
});
