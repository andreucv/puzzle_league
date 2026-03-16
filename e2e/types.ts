/**
 * Shared test-data interfaces for E2E tests.
 *
 * These represent what a user types into HTML form fields, so every value is a
 * string and field names use snake_case to match the form `name` attributes.
 *
 * They intentionally differ from the Prisma-generated types (which use
 * camelCase and proper DB types like DateTime / number / CategoryType).
 */

export interface CompetitionData {
    name: string;
    location: string;
    description: string;
    country?: string;
    postal_code?: string;
    payment_method?: string;
}

export interface CategoryData {
    description: string;
    type: string;
    start_time: string;
    end_time: string;
    max_parties: string;
    participants_per_party: string;
    price?: string;
}

export interface MultiDayCategoryData extends CategoryData {
    start_date: Date;
    end_date: Date;
}
