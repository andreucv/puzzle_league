import { describe, it, expect } from 'vitest';
import {
	validateCompetitionForm,
	type FormData,
	type CategoriesState,
	type CategoriesTimesState
} from './competition_form_validation';

// Identity translation function — returns the key as-is
const t = (key: string) => key;

// Helper to build empty state
function emptyCategories(): CategoriesState {
	return { create: [], update: [] };
}

function emptyCategoriesTimes(): CategoriesTimesState {
	return { create: [], update: [] };
}

function validFormData(): FormData {
	return {
		name: 'Valid Competition',
		description: 'A short description',
		location: 'Madrid',
		paymentMethod: 'Cash',
		startDate: '2026-03-20T00:00:00Z',
		endDate: '2026-03-20T00:00:00Z'
	};
}

function validCategory() {
	return {
		description: '500 pcs',
		type: 'Individual',
		maxParties: 10,
		maxPartySize: 1,
		price: 10
	};
}

function validCategoryTimes() {
	return { startTime: '10:00', endTime: '12:00' };
}

// ==========================================================================
// Tests migrated from E2E (e2e/competition/create.test.ts validation block)
// ==========================================================================

describe('Competition Form Validation', () => {
	describe('Competition name validation', () => {
		it('returns error when competition name is empty', () => {
			const result = validateCompetitionForm(
				{ name: '' },
				emptyCategories(),
				emptyCategoriesTimes(),
				false,
				t
			);

			expect(result.isValid).toBe(false);
			expect(result.formErrors.name).toBe(
				'competition.form_error.required.competition_name'
			);
		});

		it('returns error when competition name is too short', () => {
			const result = validateCompetitionForm(
				{ name: 'AB' },
				emptyCategories(),
				emptyCategoriesTimes(),
				false,
				t
			);

			expect(result.isValid).toBe(false);
			expect(result.formErrors.name).toBe(
				'competition.form_error.min_length.competition_name'
			);
		});

		it('returns error when competition name is too long (>80 chars)', () => {
			const result = validateCompetitionForm(
				{ name: 'A'.repeat(81) },
				emptyCategories(),
				emptyCategoriesTimes(),
				false,
				t
			);

			expect(result.isValid).toBe(false);
			expect(result.formErrors.name).toBe(
				'competition.form_error.max_length.competition_name'
			);
		});
	});

	describe('Date validation', () => {
		it('returns error when date is not selected (single-day)', () => {
			const result = validateCompetitionForm(
				{ name: 'Valid Competition Name' },
				emptyCategories(),
				emptyCategoriesTimes(),
				false,
				t
			);

			expect(result.isValid).toBe(false);
			expect(result.dateError).toBe('competition.form_error.required.date');
		});

		it('returns error when start date is missing (multi-day)', () => {
			const result = validateCompetitionForm(
				{ name: 'Valid Competition', endDate: '2026-03-21T00:00:00Z' },
				emptyCategories(),
				emptyCategoriesTimes(),
				true,
				t
			);

			expect(result.isValid).toBe(false);
			expect(result.dateError).toBe('competition.form_error.required.start_date');
		});

		it('returns error when end date is missing (multi-day)', () => {
			const result = validateCompetitionForm(
				{ name: 'Valid Competition', startDate: '2026-03-20T00:00:00Z' },
				emptyCategories(),
				emptyCategoriesTimes(),
				true,
				t
			);

			expect(result.isValid).toBe(false);
			expect(result.dateError).toBe('competition.form_error.required.end_date');
		});
	});

	describe('Category validation (create)', () => {
		it('returns error when category start time is missing', () => {
			const categories: CategoriesState = {
				create: [validCategory()],
				update: []
			};
			const times: CategoriesTimesState = {
				create: [{ startTime: '', endTime: '12:00' }],
				update: []
			};

			const result = validateCompetitionForm(validFormData(), categories, times, false, t);

			expect(result.isValid).toBe(false);
			expect(result.categoryErrors.create[0].startTime).toBe(
				'competition.form_error.required.start_time'
			);
		});

		it('returns error when category end time is missing', () => {
			const categories: CategoriesState = {
				create: [validCategory()],
				update: []
			};
			const times: CategoriesTimesState = {
				create: [{ startTime: '10:00', endTime: '' }],
				update: []
			};

			const result = validateCompetitionForm(validFormData(), categories, times, false, t);

			expect(result.isValid).toBe(false);
			expect(result.categoryErrors.create[0].endTime).toBe(
				'competition.form_error.required.end_time'
			);
		});

		it('returns error when category max parties is missing', () => {
			const categories: CategoriesState = {
				create: [{ ...validCategory(), maxParties: null }],
				update: []
			};
			const times: CategoriesTimesState = {
				create: [validCategoryTimes()],
				update: []
			};

			const result = validateCompetitionForm(validFormData(), categories, times, false, t);

			expect(result.isValid).toBe(false);
			expect(result.categoryErrors.create[0].maxParties).toBe(
				'competition.form_error.min_value.max_parties'
			);
		});

		it('returns error when category max parties is zero', () => {
			const categories: CategoriesState = {
				create: [{ ...validCategory(), maxParties: 0 }],
				update: []
			};
			const times: CategoriesTimesState = {
				create: [validCategoryTimes()],
				update: []
			};

			const result = validateCompetitionForm(validFormData(), categories, times, false, t);

			expect(result.isValid).toBe(false);
			expect(result.categoryErrors.create[0].maxParties).toBe(
				'competition.form_error.min_value.max_parties'
			);
		});

		it('returns error when category max party size is less than 1', () => {
			const categories: CategoriesState = {
				create: [{ ...validCategory(), maxPartySize: 0 }],
				update: []
			};
			const times: CategoriesTimesState = {
				create: [validCategoryTimes()],
				update: []
			};

			const result = validateCompetitionForm(validFormData(), categories, times, false, t);

			expect(result.isValid).toBe(false);
			expect(result.categoryErrors.create[0].maxPartySize).toBe(
				'competition.form_error.min_value.max_party_size'
			);
		});

		it('returns error when category price is negative', () => {
			const categories: CategoriesState = {
				create: [{ ...validCategory(), price: -1 }],
				update: []
			};
			const times: CategoriesTimesState = {
				create: [validCategoryTimes()],
				update: []
			};

			const result = validateCompetitionForm(validFormData(), categories, times, false, t);

			expect(result.isValid).toBe(false);
			expect(result.categoryErrors.create[0].price).toBe(
				'competition.form_error.min_value.price'
			);
		});

		it('returns error when category description is too long (>60 chars)', () => {
			const categories: CategoriesState = {
				create: [{ ...validCategory(), description: 'A'.repeat(61) }],
				update: []
			};
			const times: CategoriesTimesState = {
				create: [validCategoryTimes()],
				update: []
			};

			const result = validateCompetitionForm(validFormData(), categories, times, false, t);

			expect(result.isValid).toBe(false);
			expect(result.categoryErrors.create[0].description).toBe(
				'competition.form_error.max_length.category_description'
			);
		});
	});

	describe('Multi-day category date validation', () => {
		it('returns error when category start date is missing in multi-day mode', () => {
			const categories: CategoriesState = {
				create: [validCategory()],
				update: []
			};
			const times: CategoriesTimesState = {
				create: [{ ...validCategoryTimes(), date: null, endDate: new Date() }],
				update: []
			};
			const formData = {
				...validFormData(),
				endDate: '2026-03-21T00:00:00Z'
			};

			const result = validateCompetitionForm(formData, categories, times, true, t);

			expect(result.isValid).toBe(false);
			expect(result.categoryErrors.create[0].date).toBe(
				'competition.form_error.required.category_date'
			);
		});

		it('returns error when category end date is missing in multi-day mode', () => {
			const categories: CategoriesState = {
				create: [validCategory()],
				update: []
			};
			const times: CategoriesTimesState = {
				create: [{ ...validCategoryTimes(), date: new Date(), endDate: null }],
				update: []
			};
			const formData = {
				...validFormData(),
				endDate: '2026-03-21T00:00:00Z'
			};

			const result = validateCompetitionForm(formData, categories, times, true, t);

			expect(result.isValid).toBe(false);
			expect(result.categoryErrors.create[0].endDate).toBe(
				'competition.form_error.required.category_end_date'
			);
		});
	});

	describe('Form field max length validation', () => {
		it('returns error when description exceeds 1000 chars', () => {
			const result = validateCompetitionForm(
				{ ...validFormData(), description: 'A'.repeat(1001) },
				emptyCategories(),
				emptyCategoriesTimes(),
				false,
				t
			);

			expect(result.isValid).toBe(false);
			expect(result.formErrors.description).toBe(
				'competition.form_error.max_length.description'
			);
		});

		it('returns error when payment method exceeds 500 chars', () => {
			const result = validateCompetitionForm(
				{ ...validFormData(), paymentMethod: 'A'.repeat(501) },
				emptyCategories(),
				emptyCategoriesTimes(),
				false,
				t
			);

			expect(result.isValid).toBe(false);
			expect(result.formErrors.paymentMethod).toBe(
				'competition.form_error.max_length.payment_method'
			);
		});

		it('returns error when location exceeds 200 chars', () => {
			const result = validateCompetitionForm(
				{ ...validFormData(), location: 'A'.repeat(201) },
				emptyCategories(),
				emptyCategoriesTimes(),
				false,
				t
			);

			expect(result.isValid).toBe(false);
			expect(result.formErrors.location).toBe(
				'competition.form_error.max_length.location'
			);
		});
	});

	describe('Multiple errors and revalidation', () => {
		it('returns all errors when multiple fields are missing', () => {
			const result = validateCompetitionForm(
				{},
				emptyCategories(),
				emptyCategoriesTimes(),
				false,
				t
			);

			expect(result.isValid).toBe(false);
			expect(result.formErrors.name).toBe(
				'competition.form_error.required.competition_name'
			);
			expect(result.dateError).toBe('competition.form_error.required.date');
		});

		it('error disappears when field is fixed and revalidated', () => {
			// First validation: name missing
			const result1 = validateCompetitionForm(
				{},
				emptyCategories(),
				emptyCategoriesTimes(),
				false,
				t
			);
			expect(result1.isValid).toBe(false);
			expect(result1.formErrors.name).toBeDefined();

			// Second validation: name fixed, date still missing
			const result2 = validateCompetitionForm(
				{ name: 'Valid Competition Name', startDate: '2026-03-20T00:00:00Z' },
				emptyCategories(),
				emptyCategoriesTimes(),
				false,
				t
			);
			expect(result2.formErrors.name).toBeUndefined();
			expect(result2.dateError).toBeNull();
			expect(result2.isValid).toBe(true);
		});
	});

	describe('Update category validation', () => {
		it('validates update categories the same as create categories', () => {
			const categories: CategoriesState = {
				create: [],
				update: [{ data: { ...validCategory(), maxParties: 0 } }]
			};
			const times: CategoriesTimesState = {
				create: [],
				update: [validCategoryTimes()]
			};

			const result = validateCompetitionForm(validFormData(), categories, times, false, t);

			expect(result.isValid).toBe(false);
			expect(result.categoryErrors.update[0].maxParties).toBe(
				'competition.form_error.min_value.max_parties'
			);
		});
	});

	describe('Valid form', () => {
		it('returns isValid=true when all fields are valid with no categories', () => {
			const result = validateCompetitionForm(
				validFormData(),
				emptyCategories(),
				emptyCategoriesTimes(),
				false,
				t
			);

			expect(result.isValid).toBe(true);
			expect(result.formErrors).toEqual({});
			expect(result.dateError).toBeNull();
		});

		it('returns isValid=true when all fields and categories are valid', () => {
			const categories: CategoriesState = {
				create: [validCategory()],
				update: []
			};
			const times: CategoriesTimesState = {
				create: [validCategoryTimes()],
				update: []
			};

			const result = validateCompetitionForm(validFormData(), categories, times, false, t);

			expect(result.isValid).toBe(true);
			expect(result.categoryErrors.create[0]).toEqual({});
		});
	});
});
