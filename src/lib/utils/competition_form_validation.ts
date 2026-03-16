/**
 * Pure validation function for the competition create/edit form.
 * Extracted from +page.svelte so it can be unit-tested without rendering the component.
 */

export interface CategoryErrors {
	description?: string;
	type?: string;
	startTime?: string;
	endTime?: string;
	maxParties?: string;
	maxPartySize?: string;
	price?: string;
	date?: string;
	endDate?: string;
}

export interface FormErrors {
	name?: string;
	location?: string;
	description?: string;
	country?: string;
	postalCode?: string;
	paymentMethod?: string;
}

export interface ValidationResult {
	isValid: boolean;
	formErrors: FormErrors;
	dateError: string | null;
	categoryErrors: {
		create: CategoryErrors[];
		update: CategoryErrors[];
	};
}

export interface FormData {
	name?: string;
	description?: string | null;
	location?: string | null;
	paymentMethod?: string | null;
	startDate?: string | null;
	endDate?: string | null;
}

export interface CategoryData {
	description: string;
	type: string;
	maxParties: number | null;
	maxPartySize: number | null;
	price: number | null | undefined;
}

export interface CategoryTimesData {
	startTime?: string;
	endTime?: string;
	date?: unknown;
	endDate?: unknown;
}

export interface CategoriesState {
	create: CategoryData[];
	update: Array<{ data: CategoryData }>;
}

export interface CategoriesTimesState {
	create: CategoryTimesData[];
	update: CategoryTimesData[];
}

export function validateCompetitionForm(
	formData: FormData,
	categories: CategoriesState,
	categoriesTimes: CategoriesTimesState,
	isMultiDay: boolean,
	t: (key: string) => string
): ValidationResult {
	let isValid = true;
	const formErrors: FormErrors = {};
	let dateError: string | null = null;
	const categoryErrors: { create: CategoryErrors[]; update: CategoryErrors[] } = {
		create: [],
		update: []
	};

	// Validate competition name (required, 3-80 chars)
	if (!formData.name || formData.name.trim() === '') {
		formErrors.name = t('competition.form_error.required.competition_name');
		isValid = false;
	} else if (formData.name.length < 3) {
		formErrors.name = t('competition.form_error.min_length.competition_name');
		isValid = false;
	} else if (formData.name.length > 80) {
		formErrors.name = t('competition.form_error.max_length.competition_name');
		isValid = false;
	}

	// Validate description (max 1000 chars)
	if (formData.description && formData.description.length > 1000) {
		formErrors.description = t('competition.form_error.max_length.description');
		isValid = false;
	}

	// Validate payment method (max 500 chars)
	if (formData.paymentMethod && formData.paymentMethod.length > 500) {
		formErrors.paymentMethod = t('competition.form_error.max_length.payment_method');
		isValid = false;
	}

	// Validate location (max 200 chars)
	if (formData.location && formData.location.length > 200) {
		formErrors.location = t('competition.form_error.max_length.location');
		isValid = false;
	}

	// Validate date (required)
	if (!isMultiDay && !formData.startDate) {
		dateError = t('competition.form_error.required.date');
		isValid = false;
	}
	if (isMultiDay && !formData.startDate) {
		dateError = t('competition.form_error.required.start_date');
		isValid = false;
	}
	if (isMultiDay && !formData.endDate) {
		dateError = t('competition.form_error.required.end_date');
		isValid = false;
	}

	// Validate create categories
	const createCategories = categories.create || [];
	for (let i = 0; i < createCategories.length; i++) {
		const cat = createCategories[i];
		categoryErrors.create[i] = {};

		if (cat.description.length > 60) {
			categoryErrors.create[i].description = t(
				'competition.form_error.max_length.category_description'
			);
			isValid = false;
		}

		if (!cat.type || cat.type === '') {
			categoryErrors.create[i].type = t('competition.form_error.required.category_type');
			isValid = false;
		}

		if (cat.type) {
			if (isMultiDay && !categoriesTimes.create[i]?.date) {
				categoryErrors.create[i].date = t('competition.form_error.required.category_date');
				isValid = false;
			}

			if (!categoriesTimes.create[i]?.startTime) {
				categoryErrors.create[i].startTime = t('competition.form_error.required.start_time');
				isValid = false;
			}

			if (isMultiDay && !categoriesTimes.create[i]?.endDate) {
				categoryErrors.create[i].endDate = t(
					'competition.form_error.required.category_end_date'
				);
				isValid = false;
			}

			if (!categoriesTimes.create[i]?.endTime) {
				categoryErrors.create[i].endTime = t('competition.form_error.required.end_time');
				isValid = false;
			}

			if (!cat.maxParties || cat.maxParties < 1) {
				categoryErrors.create[i].maxParties = t(
					'competition.form_error.min_value.max_parties'
				);
				isValid = false;
			}

			if (!cat.maxPartySize || cat.maxPartySize < 1) {
				categoryErrors.create[i].maxPartySize = t(
					'competition.form_error.min_value.max_party_size'
				);
				isValid = false;
			}

			if (cat.price === null || cat.price === undefined || cat.price < 0) {
				categoryErrors.create[i].price = t('competition.form_error.min_value.price');
				isValid = false;
			}
		}
	}

	// Validate update categories
	const updateCategories = categories.update || [];
	for (let i = 0; i < updateCategories.length; i++) {
		const cat = updateCategories[i].data;
		categoryErrors.update[i] = {};

		if (cat.description.length > 60) {
			categoryErrors.update[i].description = t(
				'competition.form_error.max_length.category_description'
			);
			isValid = false;
		}

		if (!cat.type || cat.type === '') {
			categoryErrors.update[i].type = t('competition.form_error.required.category_type');
			isValid = false;
		}

		if (cat.type) {
			if (isMultiDay && !categoriesTimes.update[i]?.date) {
				categoryErrors.update[i].date = t('competition.form_error.required.category_date');
				isValid = false;
			}

			if (!categoriesTimes.update[i]?.startTime) {
				categoryErrors.update[i].startTime = t(
					'competition.form_error.required.start_time'
				);
				isValid = false;
			}

			if (isMultiDay && !categoriesTimes.update[i]?.endDate) {
				categoryErrors.update[i].endDate = t(
					'competition.form_error.required.category_end_date'
				);
				isValid = false;
			}

			if (!categoriesTimes.update[i]?.endTime) {
				categoryErrors.update[i].endTime = t('competition.form_error.required.end_time');
				isValid = false;
			}

			if (!cat.maxParties || cat.maxParties < 1) {
				categoryErrors.update[i].maxParties = t(
					'competition.form_error.min_value.max_parties'
				);
				isValid = false;
			}

			if (!cat.maxPartySize || cat.maxPartySize < 1) {
				categoryErrors.update[i].maxPartySize = t(
					'competition.form_error.min_value.max_party_size'
				);
				isValid = false;
			}

			if (cat.price === null || cat.price === undefined || cat.price < 0) {
				categoryErrors.update[i].price = t('competition.form_error.min_value.price');
				isValid = false;
			}
		}
	}

	return { isValid, formErrors, dateError, categoryErrors };
}
