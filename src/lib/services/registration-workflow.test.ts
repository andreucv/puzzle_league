import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { RegistrationOpenScheduler } from './registration-open-scheduler';
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
	notifyWaitlistPromotions,
	promoteWaitlistedAfterCapacityChange,
	refuseRegistration,
	cancelCategoryRegistrationOpening,
	closeAllCategoryRegistrations,
	scheduleAllCategoryRegistrationOpenings,
	scheduleCategoryRegistrationOpening,
	submitRegistration,
	toggleCategoryRegistration,
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
			findUnique: mockFn(prismaMock.category.findUnique),
			findUniqueOrThrow: mockFn(prismaMock.category.findUniqueOrThrow),
			update: mockFn(prismaMock.category.update),
			updateMany: mockFn(prismaMock.category.updateMany),
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
		registrationOpen: true,
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

	it('lets organizer registration override a closed category and auto-confirm', async () => {
		const competition = makeCompetition();
		const category = makeCategory({ competition, registrationOpen: false });
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

	it('rejects participant signup when the category registration is closed', async () => {
		const competition = makeCompetition();
		setupSignupTx(makeCategory({ competition, registrationOpen: false, subname: 'Adults' }), competition);

		await expect(submitRegistration({
			competitionId: 42,
			actor: { userId: 'user-1', name: 'Alice', isOrganizer: false },
			signups: [{ categoryId: 1, teammateIds: [] }],
		})).rejects.toMatchObject({
			code: 'REGISTRATION_CLOSED',
			message: 'Registration is closed for category: Adults',
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

	it('promotes waitlisted entries FIFO until a raised capacity is full again', async () => {
		const tx = makeTx();
		// maxParties raised to 4 with 2 reserved and 3 waitlisted: the 2 oldest are promoted.
		tx.entry.count
			.mockResolvedValueOnce(2)
			.mockResolvedValueOnce(3)
			.mockResolvedValueOnce(4);
		tx.entry.findFirst
			.mockResolvedValueOnce({ id: 'waitlisted-1' })
			.mockResolvedValueOnce({ id: 'waitlisted-2' });
		tx.category.findUniqueOrThrow.mockResolvedValue({
			price: 500,
			competition: { showPaymentWarning: true },
		});
		tx.entry.update.mockImplementation(async ({ where, data }: any) => makeEntry({ id: where.id, status: data.status }));

		const promoted = await promoteWaitlistedAfterCapacityChange(tx as any, 1, 4);

		expect(promoted.map((entry) => entry.id)).toEqual(['waitlisted-1', 'waitlisted-2']);
		expect(promoted.every((entry) => entry.status === RegistrationStatus.PENDING_CONFIRMATION)).toBe(true);
		expect(tx.entry.findFirst).toHaveBeenCalledWith(expect.objectContaining({
			orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
		}));

		await notifyWaitlistPromotions(promoted);

		expect(mockNotifyPromotion).toHaveBeenCalledTimes(2);
		expect(mockDispatch).toHaveBeenCalledOnce();
	});

	it('does not promote anyone when capacity is still full after a category edit', async () => {
		const tx = makeTx();
		tx.entry.count.mockResolvedValue(3);

		const promoted = await promoteWaitlistedAfterCapacityChange(tx as any, 1, 2);
		await notifyWaitlistPromotions(promoted);

		expect(promoted).toEqual([]);
		expect(tx.entry.update).not.toHaveBeenCalled();
		expect(mockDispatch).not.toHaveBeenCalled();
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
		expect(mockNotifyRefused).toHaveBeenCalledWith(refusedEntry, 'Organizer', 'organizer-1');
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

	it('toggles a category registration flag for an authorized organizer', async () => {
		const tx = makeTx();
		tx.category.findUnique.mockResolvedValue({ id: 1, competitionId: 42, registrationOpen: true });
		tx.competition.findUnique.mockResolvedValue({ creatorId: 'organizer-1' });
		tx.category.update.mockResolvedValue({ id: 1, registrationOpen: false });
		mockTransaction.mockImplementation(async (callback) => callback(tx));

		const result = await toggleCategoryRegistration({
			categoryId: 1,
			actor: { userId: 'organizer-1', isOrganizer: true },
		});

		expect(tx.category.update).toHaveBeenCalledWith(expect.objectContaining({
			where: { id: 1 },
			data: { registrationOpen: false, registrationOpensAt: null },
		}));
		expect(result).toEqual({ id: 1, registrationOpen: false });
	});

	it('rejects a category registration toggle by users who cannot manage the competition', async () => {
		const tx = makeTx();
		tx.category.findUnique.mockResolvedValue({ id: 1, competitionId: 42, registrationOpen: true });
		tx.competition.findUnique.mockResolvedValue({ creatorId: 'organizer-1' });
		tx.roleAssignment.findFirst.mockResolvedValue(null);
		tx.competitionCoorganizerRoleAssignment.findFirst.mockResolvedValue(null);
		mockTransaction.mockImplementation(async (callback) => callback(tx));

		await expect(toggleCategoryRegistration({
			categoryId: 1,
			actor: { userId: 'user-1', isOrganizer: false },
		})).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
		expect(tx.category.update).not.toHaveBeenCalled();
	});

	it('closes every open NOT_STARTED category of a competition for an authorized organizer', async () => {
		const tx = makeTx();
		tx.competition.findUnique.mockResolvedValue({ creatorId: 'organizer-1' });
		tx.category.updateMany.mockResolvedValue({ count: 2 });
		mockTransaction.mockImplementation(async (callback) => callback(tx));

		const result = await closeAllCategoryRegistrations({
			competitionId: 42,
			actor: { userId: 'organizer-1', isOrganizer: true },
		});

		expect(tx.category.updateMany).toHaveBeenCalledWith({
			where: {
				competitionId: 42,
				status: CategoryStatus.NOT_STARTED,
				OR: [{ registrationOpen: true }, { registrationOpensAt: { not: null } }],
			},
			data: { registrationOpen: false, registrationOpensAt: null },
		});
		expect(result).toEqual({ closedCount: 2 });
	});

	it('rejects closing all categories by users who cannot manage the competition', async () => {
		const tx = makeTx();
		tx.competition.findUnique.mockResolvedValue({ creatorId: 'organizer-1' });
		tx.roleAssignment.findFirst.mockResolvedValue(null);
		tx.competitionCoorganizerRoleAssignment.findFirst.mockResolvedValue(null);
		mockTransaction.mockImplementation(async (callback) => callback(tx));

		await expect(closeAllCategoryRegistrations({
			competitionId: 42,
			actor: { userId: 'user-1', isOrganizer: false },
		})).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
		expect(tx.category.updateMany).not.toHaveBeenCalled();
	});

	describe('scheduled opening', () => {
		const future = () => new Date(Date.now() + 60 * 60 * 1000);
		const organizer = { userId: 'organizer-1', isOrganizer: true };
		let scheduler: { publish: Mock<RegistrationOpenScheduler['publish']> };

		beforeEach(() => {
			scheduler = { publish: vi.fn<RegistrationOpenScheduler['publish']>().mockResolvedValue(undefined) };
		});

		function setupCategoryTx(category: Record<string, unknown>) {
			const tx = makeTx();
			tx.category.findUnique.mockResolvedValue({ id: 1, competitionId: 42, status: CategoryStatus.NOT_STARTED, registrationOpen: false, ...category });
			tx.competition.findUnique.mockResolvedValue({ creatorId: 'organizer-1' });
			mockTransaction.mockImplementation(async (callback) => callback(tx));
			return tx;
		}

		it('publishes the QStash message, then stores the opening time', async () => {
			setupCategoryTx({});
			const opensAt = future();

			await scheduleCategoryRegistrationOpening({ categoryId: 1, opensAt, actor: organizer, scheduler });

			expect(scheduler.publish).toHaveBeenCalledWith(1, opensAt);
			expect(prismaMock.category.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { registrationOpensAt: opensAt } });
		});

		it('rejects an opening time in the past without publishing', async () => {
			setupCategoryTx({});

			await expect(scheduleCategoryRegistrationOpening({
				categoryId: 1, opensAt: new Date(Date.now() - 1000), actor: organizer, scheduler,
			})).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
			expect(scheduler.publish).not.toHaveBeenCalled();
		});

		it('rejects scheduling a category that is already open', async () => {
			setupCategoryTx({ registrationOpen: true });

			await expect(scheduleCategoryRegistrationOpening({
				categoryId: 1, opensAt: future(), actor: organizer, scheduler,
			})).rejects.toMatchObject({ code: 'INVALID_STATUS' });
			expect(scheduler.publish).not.toHaveBeenCalled();
		});

		it('rejects scheduling by users who cannot manage the competition', async () => {
			const tx = setupCategoryTx({});
			tx.roleAssignment.findFirst.mockResolvedValue(null);
			tx.competitionCoorganizerRoleAssignment.findFirst.mockResolvedValue(null);

			await expect(scheduleCategoryRegistrationOpening({
				categoryId: 1, opensAt: future(), actor: { userId: 'user-1', isOrganizer: false }, scheduler,
			})).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
			expect(scheduler.publish).not.toHaveBeenCalled();
		});

		it('schedules every closed NOT_STARTED category of the competition', async () => {
			const tx = setupCategoryTx({});
			tx.category.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
			const opensAt = future();

			const result = await scheduleAllCategoryRegistrationOpenings({ competitionId: 42, opensAt, actor: organizer, scheduler });

			expect(tx.category.findMany).toHaveBeenCalledWith(expect.objectContaining({
				where: { competitionId: 42, status: CategoryStatus.NOT_STARTED, registrationOpen: false },
			}));
			expect(scheduler.publish).toHaveBeenCalledTimes(2);
			expect(prismaMock.category.updateMany).toHaveBeenCalledWith({ where: { id: { in: [1, 2] } }, data: { registrationOpensAt: opensAt } });
			expect(result).toEqual({ scheduledCount: 2 });
		});

		it('cancels a scheduled opening by clearing the stored time', async () => {
			const tx = setupCategoryTx({});

			await cancelCategoryRegistrationOpening({ categoryId: 1, actor: organizer });

			expect(tx.category.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { registrationOpensAt: null } });
		});
	});
});
