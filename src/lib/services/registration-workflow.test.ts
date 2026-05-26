import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CategoryStatus, RegistrationStatus } from '$lib/.prisma/generated/prisma/enums';

const mockTransaction = vi.fn();
const mockNotifyCreated = vi.fn().mockResolvedValue(undefined);
const mockNotifyWaitlisted = vi.fn().mockResolvedValue(undefined);
const mockNotifyConfirmed = vi.fn().mockResolvedValue(undefined);
const mockNotifyRefused = vi.fn().mockResolvedValue(undefined);
const mockNotifyPromotion = vi.fn().mockResolvedValue(undefined);

vi.mock('$lib/database/create_prisma_client', () => ({
	prisma: {
		$transaction: (...args: unknown[]) => mockTransaction(...args),
	},
}));

vi.mock('$lib/notifications/registration_notifications', () => ({
	notifyRegistrationCreatedForTeammates: (...args: unknown[]) => mockNotifyCreated(...args),
	notifyRegistrationWaitlisted: (...args: unknown[]) => mockNotifyWaitlisted(...args),
	notifyRegistrationConfirmed: (...args: unknown[]) => mockNotifyConfirmed(...args),
	notifyRegistrationRefused: (...args: unknown[]) => mockNotifyRefused(...args),
	notifyWaitlistPromotion: (...args: unknown[]) => mockNotifyPromotion(...args),
}));

import {
	RegistrationWorkflowError,
	confirmRegistration,
	refuseRegistration,
	submitRegistration,
	unregisterRegistration,
} from './registration-workflow';

function makeTx() {
	return {
		competition: {
			findUnique: vi.fn(),
		},
		category: {
			findMany: vi.fn(),
			findUniqueOrThrow: vi.fn(),
		},
		entry: {
			count: vi.fn().mockResolvedValue(0),
			findMany: vi.fn().mockResolvedValue([]),
			findFirst: vi.fn(),
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn().mockResolvedValue({}),
		},
		user: {
			findMany: vi.fn(),
		},
		externalParticipant: {
			findMany: vi.fn(),
		},
		roleAssignment: {
			findFirst: vi.fn(),
		},
	};
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
	beforeEach(() => {
		vi.clearAllMocks();
	});

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
