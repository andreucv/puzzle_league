import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryTypeSchema } from './CategoryTypeSchema';
import { CompetitionCreateNestedOneWithoutCategoriesInputSchema } from './CompetitionCreateNestedOneWithoutCategoriesInputSchema';
import { PuzzleCreateNestedManyWithoutCategoriesInputSchema } from './PuzzleCreateNestedManyWithoutCategoriesInputSchema';

export const CategoryCreateWithoutRecordsInputSchema: z.ZodType<Prisma.CategoryCreateWithoutRecordsInput> = z.object({
  description: z.string(),
  subname: z.string().optional().nullable(),
  type: z.lazy(() => CategoryTypeSchema),
  maxPartySize: z.number().int().optional().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  realStartTime: z.coerce.date().optional().nullable(),
  realEndTime: z.coerce.date().optional().nullable(),
  status: z.string().optional(),
  maxParties: z.number().int().optional().nullable(),
  competition: z.lazy(() => CompetitionCreateNestedOneWithoutCategoriesInputSchema),
  puzzles: z.lazy(() => PuzzleCreateNestedManyWithoutCategoriesInputSchema).optional()
}).strict();

export default CategoryCreateWithoutRecordsInputSchema;
