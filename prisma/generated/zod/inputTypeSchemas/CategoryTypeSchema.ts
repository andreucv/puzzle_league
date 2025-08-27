import { z } from 'zod';

export const CategoryTypeSchema = z.enum(['INDIVIDUAL','PAIRS','TEAM','JUNIOR_INDIVIDUAL','JUNIOR_PAIRS','PUZZLE_CHESS','OTHER']);

export type CategoryTypeType = `${z.infer<typeof CategoryTypeSchema>}`

export default CategoryTypeSchema;
